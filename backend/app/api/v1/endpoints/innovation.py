"""
Innovation API endpoints for idea combination and expansion
"""

from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer
from bson import ObjectId
from datetime import datetime

from app.models.idea import IdeaCombination, IdeaExpansion
from app.models.user import User
from app.models.innovation import InnovationResult, InnovationResultCreate
from app.core.database import get_collection
from app.services.innovation_service import innovation_service
from app.api.v1.endpoints.users import get_current_user

router = APIRouter()
security = HTTPBearer()




@router.post("/combine", response_model=Dict)
async def combine_ideas(
    request_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Combine multiple ideas into a new hybrid idea"""
    try:
        idea_ids = request_data.get("idea_ids", [])
        combination_type = request_data.get("combination_type", "creative")
        
        if len(idea_ids) < 2:
            raise HTTPException(
                status_code=400,
                detail="At least 2 ideas required for combination"
            )
        
        ideas_collection = get_collection("ideas")
        combinations_collection = get_collection("combinations")
        
        # Get the ideas to combine
        ideas = []
        for idea_id in idea_ids:
            idea = await ideas_collection.find_one({
                "_id": ObjectId(idea_id),
                "user_id": current_user.id
            })
            if not idea:
                raise HTTPException(
                    status_code=404,
                    detail=f"Idea {idea_id} not found"
                )
            ideas.append(idea)
        
        # Combine ideas using innovation service
        combination_result = await innovation_service.combine_ideas(ideas, combination_type)
        
        # Save combination to database
        combination_doc = {
            "user_id": current_user.id,
            "source_idea_ids": idea_ids,
            "combined_content": combination_result["combined_content"],
            "novelty_score": combination_result["novelty_score"],
            "expansion_suggestions": combination_result["expansion_suggestions"],
            "combination_type": combination_type,
            "created_at": datetime.utcnow()
        }
        
        result = await combinations_collection.insert_one(combination_doc)
        combination_doc["_id"] = str(result.inserted_id)
        
        # Save to innovation results for persistent storage
        innovation_results_collection = get_collection("innovation_results")
        innovation_result = {
            "user_id": current_user.id,
            "type": "combination",
            "title": f"Combination of {len(idea_ids)} Ideas",
            "content": combination_result["combined_content"],
            "source_idea_ids": idea_ids,
            "combination_type": combination_type,
            "novelty_score": combination_result["novelty_score"],
            "expansion_suggestions": combination_result["expansion_suggestions"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        innovation_result_insert = await innovation_results_collection.insert_one(innovation_result)
        innovation_result["_id"] = str(innovation_result_insert.inserted_id)
        
        return {
            "combination": IdeaCombination(**combination_doc),
            "result": combination_result,
            "saved_result": InnovationResult(**innovation_result)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to combine ideas")


@router.post("/expand", response_model=Dict)
async def expand_idea(
    request_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Expand a raw idea into a detailed proposal"""
    try:
        idea_id = request_data.get("idea_id")
        expansion_type = request_data.get("expansion_type", "comprehensive")
        
        if not idea_id:
            raise HTTPException(status_code=400, detail="idea_id is required")
        
        ideas_collection = get_collection("ideas")
        expansions_collection = get_collection("expansions")
        
        # Get the idea to expand
        idea = await ideas_collection.find_one({
            "_id": ObjectId(idea_id),
            "user_id": current_user.id
        })
        
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")
        
        # Expand idea using innovation service
        expansion_result = await innovation_service.expand_idea(idea, expansion_type)
        
        # Save expansion to database
        expansion_doc = {
            "user_id": current_user.id,
            "source_idea_id": idea_id,
            "expansion_type": expansion_type,
            "expanded_content": expansion_result["expanded_content"],
            "feasibility_score": expansion_result["feasibility_score"],
            "created_at": datetime.utcnow()
        }
        
        result = await expansions_collection.insert_one(expansion_doc)
        expansion_doc["_id"] = str(result.inserted_id)
        
        # Save to innovation results for persistent storage
        innovation_results_collection = get_collection("innovation_results")
        innovation_result = {
            "user_id": current_user.id,
            "type": "expansion",
            "title": f"Expansion: {idea['title']}",
            "content": expansion_result["expanded_content"],
            "source_idea_id": idea_id,
            "expansion_type": expansion_type,
            "feasibility_score": expansion_result["feasibility_score"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        innovation_result_insert = await innovation_results_collection.insert_one(innovation_result)
        innovation_result["_id"] = str(innovation_result_insert.inserted_id)
        
        return {
            "expansion": IdeaExpansion(**expansion_doc),
            "result": expansion_result,
            "saved_result": InnovationResult(**innovation_result)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to expand idea")


@router.get("/combinations", response_model=List[IdeaCombination])
async def get_combinations(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """Get user's idea combinations"""
    try:
        combinations_collection = get_collection("combinations")
        cursor = combinations_collection.find({"user_id": current_user.id}).skip(skip).limit(limit)
        combinations = await cursor.to_list(limit)
        
        return [IdeaCombination(**combination) for combination in combinations]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch combinations")


@router.get("/expansions", response_model=List[IdeaExpansion])
async def get_expansions(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """Get user's idea expansions"""
    try:
        expansions_collection = get_collection("expansions")
        cursor = expansions_collection.find({"user_id": current_user.id}).skip(skip).limit(limit)
        expansions = await cursor.to_list(limit)
        
        return [IdeaExpansion(**expansion) for expansion in expansions]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch expansions")


@router.get("/suggestions/{idea_id}")
async def get_expansion_suggestions(
    idea_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get expansion suggestions for an idea"""
    try:
        ideas_collection = get_collection("ideas")
        
        # Get the idea
        idea = await ideas_collection.find_one({
            "_id": ObjectId(idea_id),
            "user_id": current_user.id
        })
        
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")
        
        # Generate expansion suggestions
        suggestions = await innovation_service._generate_expansion_suggestions(idea["content"])
        
        # Add feasibility scores for each suggestion
        suggestions_with_scores = []
        for suggestion in suggestions:
            feasibility_score = await innovation_service._calculate_feasibility_score(
                idea["content"], suggestion.lower().replace(" ", "_")
            )
            suggestions_with_scores.append({
                "suggestion": suggestion,
                "feasibility_score": feasibility_score
            })
        
        # Sort by feasibility score
        suggestions_with_scores.sort(key=lambda x: x["feasibility_score"], reverse=True)
        
        # Save to innovation results for persistent storage
        innovation_results_collection = get_collection("innovation_results")
        innovation_result = {
            "user_id": current_user.id,
            "type": "suggestions",
            "title": f"Suggestions for: {idea['title']}",
            "content": f"AI-generated expansion suggestions for the idea: {idea['content']}",
            "source_idea_id": idea_id,
            "suggestions": suggestions_with_scores,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        innovation_result_insert = await innovation_results_collection.insert_one(innovation_result)
        innovation_result["_id"] = str(innovation_result_insert.inserted_id)
        
        return {
            "idea_id": idea_id,
            "suggestions": suggestions_with_scores,
            "saved_result": InnovationResult(**innovation_result)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get expansion suggestions")


@router.get("/analytics")
async def get_innovation_analytics(current_user: User = Depends(get_current_user)):
    """Get innovation analytics for the user"""
    try:
        ideas_collection = get_collection("ideas")
        combinations_collection = get_collection("combinations")
        expansions_collection = get_collection("expansions")
        
        # Get idea statistics
        total_ideas = await ideas_collection.count_documents({"user_id": current_user.id})
        
        # Get novelty statistics
        pipeline = [
            {"$match": {"user_id": current_user.id, "novelty_score": {"$exists": True}}},
            {"$group": {
                "_id": None,
                "avg_novelty": {"$avg": "$novelty_score"},
                "max_novelty": {"$max": "$novelty_score"},
                "min_novelty": {"$min": "$novelty_score"}
            }}
        ]
        novelty_stats = await ideas_collection.aggregate(pipeline).to_list(1)
        
        # Get combination statistics
        total_combinations = await combinations_collection.count_documents({"user_id": current_user.id})
        
        # Get expansion statistics
        total_expansions = await expansions_collection.count_documents({"user_id": current_user.id})
        
        # Get top novelty ideas
        top_novel_ideas = await ideas_collection.find({
            "user_id": current_user.id,
            "novelty_score": {"$exists": True}
        }).sort("novelty_score", -1).limit(5).to_list(5)
        
        return {
            "total_ideas": total_ideas,
            "total_combinations": total_combinations,
            "total_expansions": total_expansions,
            "novelty_stats": novelty_stats[0] if novelty_stats else {
                "avg_novelty": 0,
                "max_novelty": 0,
                "min_novelty": 0
            },
            "top_novel_ideas": [
                {
                    "id": str(idea["_id"]),
                    "title": idea["title"],
                    "novelty_score": idea["novelty_score"]
                }
                for idea in top_novel_ideas
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get innovation analytics")
