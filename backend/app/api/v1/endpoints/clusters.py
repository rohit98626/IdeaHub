"""
Clusters API endpoints
"""

from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from bson import ObjectId
from datetime import datetime

from app.models.idea import IdeaCluster
from app.models.user import User
from app.core.database import get_collection
from app.services.clustering_service import clustering_service
from app.services.embedding_service import embedding_service
from app.api.v1.endpoints.users import get_current_user

router = APIRouter()
security = HTTPBearer()


@router.post("/generate")
async def generate_clusters(current_user: User = Depends(get_current_user)):
    """Generate clusters for user's ideas"""
    try:
        ideas_collection = get_collection("ideas")
        clusters_collection = get_collection("clusters")
        
        # Get all user's ideas with embeddings
        user_ideas = await ideas_collection.find({
            "user_id": current_user.id,
            "embedding": {"$exists": True}
        }).to_list(1000)
        
        if len(user_ideas) < 1:
            raise HTTPException(
                status_code=400,
                detail="Need at least 1 idea with embeddings to generate clusters"
            )
        
        # Extract embeddings and texts
        embeddings = [idea["embedding"] for idea in user_ideas]
        texts = [idea["content"] for idea in user_ideas]
        idea_ids = [str(idea["_id"]) for idea in user_ideas]
        
        # Perform clustering
        try:
            # Force multiple clusters for many ideas
            n_clusters_override = None
            if len(embeddings) >= 10:
                n_clusters_override = max(2, len(embeddings) // 4)  # At least 2 clusters for 10+ ideas
            elif len(embeddings) >= 5:
                n_clusters_override = 2  # Force 2 clusters for 5+ ideas
            
            if n_clusters_override:
                clustering_result = clustering_service.cluster_ideas(embeddings, n_clusters_override)
            else:
                clustering_result = clustering_service.cluster_ideas(embeddings)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to perform clustering: {str(e)}"
            )
        
        # Get cluster summaries
        try:
            cluster_summaries = clustering_service.get_cluster_summary(
                embeddings, clustering_result["labels"], texts
            )
        except Exception as e:
            cluster_summaries = [
                {
                    "cluster_id": i,
                    "size": clustering_result["labels"].count(i),
                    "representative_text": texts[0] if texts else "No content",
                    "all_texts": [texts[j] for j, label in enumerate(clustering_result["labels"]) if label == i]
                }
                for i in range(clustering_result["n_clusters"])
            ]
        
        # Delete existing clusters for this user
        await clusters_collection.delete_many({"user_id": current_user.id})
        
        # Create new clusters
        created_clusters = []
        print(f"Creating {len(cluster_summaries)} clusters...")
        for i, summary in enumerate(cluster_summaries):
            # Get idea IDs for this cluster
            cluster_idea_indices = [
                j for j, label in enumerate(clustering_result["labels"])
                if label == summary["cluster_id"]
            ]
            cluster_idea_ids = [idea_ids[idx] for idx in cluster_idea_indices]
            
            # Create cluster document
            cluster_doc = {
                "user_id": current_user.id,
                "name": f"Cluster {summary['cluster_id'] + 1}",
                "description": f"Contains {summary['size']} related ideas",
                "idea_ids": cluster_idea_ids,
                "centroid_embedding": clustering_result["centroids"][summary["cluster_id"]]
            }
            
            # Insert cluster
            result = await clusters_collection.insert_one(cluster_doc)
            cluster_doc["_id"] = str(result.inserted_id)
            # Remove centroid embedding from response
            cluster_doc.pop("centroid_embedding", None)
            created_clusters.append(IdeaCluster(**cluster_doc))
        
        try:
            for i, label in enumerate(clustering_result["labels"]):
                if label < len(created_clusters):
                    cluster_id = str(created_clusters[label]._id)
                    await ideas_collection.update_one(
                        {"_id": ObjectId(idea_ids[i])},
                        {"$set": {"cluster_id": cluster_id}}
                    )
        except Exception as e:
            pass
        return {
            "clusters": created_clusters,
            "clustering_metrics": {
                "n_clusters": clustering_result["n_clusters"],
                "silhouette_score": clustering_result["silhouette_score"]
            },
            "cluster_summaries": cluster_summaries
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate clusters: {str(e)}")


@router.get("/", response_model=List[IdeaCluster])
async def get_clusters(current_user: User = Depends(get_current_user)):
    """Get user's clusters with their ideas"""
    try:
        clusters_collection = get_collection("clusters")
        ideas_collection = get_collection("ideas")
        
        cursor = clusters_collection.find({"user_id": current_user.id})
        clusters = await cursor.to_list(1000)
        
        # Convert ObjectIds to strings and load ideas for each cluster
        for cluster in clusters:
            if "_id" in cluster:
                cluster["_id"] = str(cluster["_id"])
            cluster.pop("centroid_embedding", None)
            
            # Load ideas for this cluster
            if "idea_ids" in cluster and cluster["idea_ids"]:
                idea_object_ids = [ObjectId(idea_id) for idea_id in cluster["idea_ids"]]
                cluster_ideas = await ideas_collection.find({
                    "_id": {"$in": idea_object_ids}
                }).to_list(1000)
                
                # Convert idea ObjectIds to strings and remove embeddings
                for idea in cluster_ideas:
                    if "_id" in idea:
                        idea["_id"] = str(idea["_id"])
                    idea.pop("embedding", None)
                
                cluster["ideas"] = cluster_ideas
                cluster["idea_count"] = len(cluster_ideas)
            else:
                cluster["ideas"] = []
                cluster["idea_count"] = 0
        
        return [IdeaCluster(**cluster) for cluster in clusters]
        
    except Exception as e:
        print(f"Error fetching clusters: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to fetch clusters")


@router.get("/{cluster_id}", response_model=IdeaCluster)
async def get_cluster(
    cluster_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific cluster with its ideas"""
    try:
        clusters_collection = get_collection("clusters")
        ideas_collection = get_collection("ideas")
        
        # Get cluster
        cluster = await clusters_collection.find_one({
            "_id": ObjectId(cluster_id),
            "user_id": current_user.id
        })
        
        if not cluster:
            raise HTTPException(status_code=404, detail="Cluster not found")
        
        # Get cluster ideas
        idea_ids = [ObjectId(idea_id) for idea_id in cluster["idea_ids"]]
        cluster_ideas = await ideas_collection.find({
            "_id": {"$in": idea_ids}
        }).to_list(1000)
        
        cluster["ideas"] = cluster_ideas
        
        return IdeaCluster(**cluster)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch cluster")


@router.put("/{cluster_id}", response_model=IdeaCluster)
async def update_cluster(
    cluster_id: str,
    name: str = None,
    description: str = None,
    current_user: User = Depends(get_current_user)
):
    """Update cluster information"""
    try:
        clusters_collection = get_collection("clusters")
        
        # Check if cluster exists
        existing_cluster = await clusters_collection.find_one({
            "_id": ObjectId(cluster_id),
            "user_id": current_user.id
        })
        
        if not existing_cluster:
            raise HTTPException(status_code=404, detail="Cluster not found")
        
        # Prepare update data
        update_data = {}
        if name is not None:
            update_data["name"] = name
        if description is not None:
            update_data["description"] = description
        
        if update_data:
            update_data["updated_at"] = datetime.utcnow()
            await clusters_collection.update_one(
                {"_id": ObjectId(cluster_id)},
                {"$set": update_data}
            )
        
        # Fetch updated cluster
        updated_cluster = await clusters_collection.find_one({"_id": ObjectId(cluster_id)})
        return IdeaCluster(**updated_cluster)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update cluster")


@router.delete("/{cluster_id}")
async def delete_cluster(
    cluster_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a cluster"""
    try:
        clusters_collection = get_collection("clusters")
        ideas_collection = get_collection("ideas")
        
        # Check if cluster exists
        existing_cluster = await clusters_collection.find_one({
            "_id": ObjectId(cluster_id),
            "user_id": current_user.id
        })
        
        if not existing_cluster:
            raise HTTPException(status_code=404, detail="Cluster not found")
        
        # Remove cluster_id from ideas
        await ideas_collection.update_many(
            {"cluster_id": cluster_id},
            {"$unset": {"cluster_id": ""}}
        )
        
        # Delete cluster
        await clusters_collection.delete_one({"_id": ObjectId(cluster_id)})
        
        return {"message": "Cluster deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete cluster")


@router.get("/{cluster_id}/similar")
async def find_similar_clusters(
    cluster_id: str,
    current_user: User = Depends(get_current_user)
):
    """Find clusters similar to the given cluster"""
    try:
        clusters_collection = get_collection("clusters")
        
        # Get target cluster
        target_cluster = await clusters_collection.find_one({
            "_id": ObjectId(cluster_id),
            "user_id": current_user.id
        })
        
        if not target_cluster:
            raise HTTPException(status_code=404, detail="Cluster not found")
        
        if not target_cluster.get("centroid_embedding"):
            raise HTTPException(
                status_code=400,
                detail="Cluster does not have centroid embedding"
            )
        
        # Get all other clusters for this user
        other_clusters = await clusters_collection.find({
            "user_id": current_user.id,
            "_id": {"$ne": ObjectId(cluster_id)},
            "centroid_embedding": {"$exists": True}
        }).to_list(1000)
        
        # Calculate similarities
        similarities = []
        for cluster in other_clusters:
            similarity = embedding_service.calculate_similarity(
                target_cluster["centroid_embedding"],
                cluster["centroid_embedding"]
            )
            similarities.append({
                "cluster": IdeaCluster(**cluster),
                "similarity": similarity
            })
        
        # Sort by similarity
        similarities.sort(key=lambda x: x["similarity"], reverse=True)
        
        return similarities[:5]  # Return top 5 similar clusters
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to find similar clusters")
