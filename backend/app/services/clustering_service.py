"""
Clustering service for grouping similar ideas using ML algorithms.
"""

import logging
from typing import List, Dict, Optional
from app.core.config import settings

try:
    import numpy as np
    from sklearn.cluster import KMeans, AgglomerativeClustering
    from sklearn.metrics import silhouette_score
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("scikit-learn not available, using simple clustering fallback")

logger = logging.getLogger(__name__)


class ClusteringService:
    """Service for clustering ideas based on their vector embeddings."""
    
    def __init__(self):
        self.algorithm = settings.CLUSTERING_ALGORITHM
        self.max_clusters = settings.MAX_CLUSTERS
    
    def cluster_ideas(self, embeddings: List[List[float]], n_clusters: Optional[int] = None) -> Dict:
        """
        Cluster ideas based on their embeddings
        
        Args:
            embeddings: List of embedding vectors
            n_clusters: Number of clusters (auto-determined if None)
        
        Returns:
            Dictionary containing cluster labels, centroids, and metrics
        """
        try:
            embeddings = self._prepare_embeddings(embeddings)

            if len(embeddings) < 2:
                return {
                    "labels": [0] * len(embeddings),
                    "centroids": embeddings,
                    "n_clusters": 1,
                    "silhouette_score": 0.0
                }
            
            # Use simple clustering if scikit-learn is not available
            if not SKLEARN_AVAILABLE:
                from app.services.simple_clustering_service import simple_clustering_service
                return simple_clustering_service.cluster_ideas(embeddings, n_clusters)
            
            # Determine optimal number of clusters
            if n_clusters is None:
                n_clusters = self._find_optimal_clusters(embeddings)
            
            # Perform clustering
            if n_clusters == 1:
                # Single cluster - all points belong to cluster 0
                labels = [0] * len(embeddings)
            else:
                if self.algorithm == "kmeans":
                    clusterer = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
                elif self.algorithm == "agglomerative":
                    clusterer = AgglomerativeClustering(n_clusters=n_clusters)
                else:
                    raise ValueError(f"Unsupported clustering algorithm: {self.algorithm}")
                
                labels = clusterer.fit_predict(embeddings)
            
            # Calculate centroids
            centroids = self._calculate_centroids(embeddings, labels, n_clusters)
            
            # Calculate silhouette score
            silhouette = self._calculate_silhouette_score(embeddings, labels)
            
            return {
                "labels": labels.tolist() if hasattr(labels, 'tolist') else labels,
                "centroids": centroids,
                "n_clusters": n_clusters,
                "silhouette_score": silhouette
            }
            
        except Exception as e:
            logger.error(f"Error in clustering: {e}")
            # Fall back to simple clustering
            try:
                from app.services.simple_clustering_service import simple_clustering_service
                logger.warning("Falling back to simple clustering due to error")
                return simple_clustering_service.cluster_ideas(embeddings, n_clusters)
            except Exception as fallback_error:
                logger.error(f"Fallback clustering also failed: {fallback_error}")
                raise
    
    def _find_optimal_clusters(self, embeddings: List[List[float]]) -> int:
        """Find optimal number of clusters using silhouette score"""
        try:
            if not SKLEARN_AVAILABLE or len(embeddings) <= 1:
                return 1
            
            if len(embeddings) == 2:
                # For 2 embeddings, check if they're similar enough to be in one cluster
                try:
                    from sklearn.metrics.pairwise import cosine_similarity
                    similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
                    # If similarity is high (>0.8), use 1 cluster, otherwise 2
                    return 1 if similarity > 0.8 else 2
                except:
                    return 2
            
            max_clusters = min(len(embeddings), self.max_clusters)
            best_score = -1
            # Start with 2 clusters if we have enough data, otherwise 1
            # Force at least 2 clusters for 4+ ideas
            if len(embeddings) >= 4:
                best_k = 2
            elif len(embeddings) >= 3:
                best_k = 2
            else:
                best_k = 1
            
            for k in range(1, max_clusters + 1):
                try:
                    if k == 1:
                        # For 1 cluster, all points are in the same cluster
                        labels = [0] * len(embeddings)
                        score = 0.0  # Silhouette score for 1 cluster is 0
                    else:
                        if self.algorithm == "kmeans":
                            # Use more iterations and better initialization for better clustering
                            clusterer = KMeans(
                                n_clusters=k, 
                                random_state=42, 
                                n_init=20,  # More initializations
                                max_iter=300,  # More iterations
                                init='k-means++'  # Better initialization
                            )
                        else:
                            clusterer = AgglomerativeClustering(
                                n_clusters=k,
                                linkage='ward'  # Better linkage method
                            )
                        
                        labels = clusterer.fit_predict(embeddings)
                        
                        if len(set(labels)) == 1:
                            score = 0.0
                        else:
                            score = silhouette_score(embeddings, labels)
                    
                    if score > best_score:
                        best_score = score
                        best_k = k
                        
                except Exception as e:
                    logger.warning(f"Error calculating silhouette for k={k}: {e}")
                    continue
            
            if best_score < 0.01 and len(embeddings) < 3:
                return 1
            
            if len(embeddings) >= 10 and best_k == 1:
                return 2
            
            if len(embeddings) >= 5 and best_k == 1 and best_score > -0.5:
                return 2
            
            return best_k
            
        except Exception as e:
            logger.error(f"Error finding optimal clusters: {e}")
            return 1
    
    def _calculate_centroids(self, embeddings: List[List[float]], labels: List[int], n_clusters: int) -> List[List[float]]:
        """Calculate cluster centroids"""
        try:
            centroids = []
            embeddings_array = np.array(embeddings)
            
            for i in range(n_clusters):
                cluster_points = embeddings_array[labels == i]
                if len(cluster_points) > 0:
                    centroid = np.mean(cluster_points, axis=0)
                    centroids.append(centroid.tolist() if hasattr(centroid, 'tolist') else centroid)
                else:
                    # Empty cluster - use zero vector
                    centroids.append([0.0] * len(embeddings[0]))
            
            return centroids
            
        except Exception as e:
            logger.error(f"Error calculating centroids: {e}")
            return [[0.0] * len(embeddings[0])] * n_clusters
    
    def _prepare_embeddings(self, embeddings: List[List[float]]) -> List[List[float]]:
        """
        Ensure embeddings are numeric and have consistent dimensions by padding shorter vectors.
        """
        if not embeddings:
            return embeddings
        
        prepared_embeddings = []
        lengths = []
        for idx, embedding in enumerate(embeddings):
            if embedding is None:
                raise ValueError(f"Embedding at index {idx} is None")
            try:
                embedding_array = np.asarray(embedding, dtype=float).flatten()
            except (TypeError, ValueError):
                raise ValueError(f"Embedding at index {idx} contains non-numeric values")
            
            lengths.append(len(embedding_array))
            prepared_embeddings.append(embedding_array)
        
        if not lengths:
            return embeddings
        
        max_length = max(lengths)
        if len(set(lengths)) > 1:
            logger.warning(
                "Inconsistent embedding dimensions detected: %s. "
                "Padding shorter vectors with zeros to match length %d.",
                sorted(set(lengths)),
                max_length
            )
        
        normalized_embeddings = []
        for embedding_array in prepared_embeddings:
            if len(embedding_array) < max_length:
                padding_width = max_length - len(embedding_array)
                embedding_array = np.pad(embedding_array, (0, padding_width), mode="constant")
            normalized_embeddings.append(embedding_array.tolist())
        
        return normalized_embeddings
    
    def _calculate_silhouette_score(self, embeddings: List[List[float]], labels: List[int]) -> float:
        """Calculate silhouette score for clustering quality"""
        try:
            if len(set(labels)) <= 1:
                return 0.0
            
            embeddings_array = np.array(embeddings)
            return float(silhouette_score(embeddings_array, labels))
            
        except Exception as e:
            logger.error(f"Error calculating silhouette score: {e}")
            return 0.0
    
    def get_cluster_summary(self, embeddings: List[List[float]], labels: List[int], texts: List[str]) -> List[Dict]:
        """Get summary information for each cluster"""
        try:
            clusters = {}
            
            # Group texts by cluster
            for i, (text, label) in enumerate(zip(texts, labels)):
                if label not in clusters:
                    clusters[label] = {
                        "cluster_id": int(label),
                        "texts": [],
                        "embeddings": [],
                        "size": 0
                    }
                
                clusters[label]["texts"].append(text)
                clusters[label]["embeddings"].append(embeddings[i])
                clusters[label]["size"] += 1
            
            # Calculate cluster statistics
            cluster_summaries = []
            for cluster_data in clusters.values():
                # Find most representative text (closest to centroid)
                cluster_embeddings = np.array(cluster_data["embeddings"])
                centroid = np.mean(cluster_embeddings, axis=0)
                
                distances = [np.linalg.norm(emb - centroid) for emb in cluster_embeddings]
                representative_idx = np.argmin(distances)
                
                cluster_summaries.append({
                    "cluster_id": cluster_data["cluster_id"],
                    "size": cluster_data["size"],
                    "representative_text": cluster_data["texts"][representative_idx],
                    "all_texts": cluster_data["texts"]
                })
            
            return cluster_summaries
            
        except Exception as e:
            logger.error(f"Error generating cluster summary: {e}")
            return []


# Global instance
clustering_service = ClusteringService()
