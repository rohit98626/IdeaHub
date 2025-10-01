"""
Ideas API endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import HTTPBearer
from bson import ObjectId
from datetime import datetime
import logging

from app.models.idea import Idea, IdeaCreate, IdeaUpdate
from app.models.user import User
from app.core.database import get_collection
from app.services.embedding_service import embedding_service
from app.services.novelty_service import novelty_service
from app.services.clustering_service import clustering_service
from app.services.voice_service import voice_service
from app.api.v1.endpoints.users import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()




@router.post("/", response_model=Idea)
async def create_idea(
    idea_data: IdeaCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new idea"""
    try:
        # Generate embedding for the idea
        embedding = await embedding_service.generate_embedding(idea_data.content)
        
        # Get existing ideas for novelty calculation
        ideas_collection = get_collection("ideas")
        existing_ideas = await ideas_collection.find({"user_id": current_user.id}).to_list(1000)
        existing_embeddings = [idea.get("embedding", []) for idea in existing_ideas if idea.get("embedding")]
        
        # Calculate novelty score
        novelty_result = await novelty_service.calculate_novelty_score(embedding, existing_embeddings)
        
        # Create idea document
        idea_doc = {
            "title": idea_data.title,
            "content": idea_data.content,
            "idea_type": idea_data.idea_type,
            "tags": idea_data.tags,
            "metadata": idea_data.metadata,
            "user_id": current_user.id,
            "embedding": embedding,
            "novelty_score": novelty_result["novelty_score"],
            "similar_ideas": [str(sim["index"]) for sim in novelty_result["similar_ideas"]],
            "status": "processed"
        }
        
        # Insert into database
        result = await ideas_collection.insert_one(idea_doc)
        idea_doc["_id"] = str(result.inserted_id)
        
        # Remove embedding from response to avoid large payloads
        idea_doc.pop("embedding", None)
        
        return Idea(**idea_doc)
        
    except Exception as e:
        logger.error(f"Error creating idea: {e}")
        raise HTTPException(status_code=500, detail="Failed to create idea")


@router.get("/", response_model=List[Idea])
async def get_ideas(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user)
):
    """Get user's ideas"""
    try:
        ideas_collection = get_collection("ideas")
        cursor = ideas_collection.find({"user_id": current_user.id}).skip(skip).limit(limit)
        ideas = await cursor.to_list(limit)
        
        # Convert ObjectIds to strings and remove embeddings
        for idea in ideas:
            if "_id" in idea:
                idea["_id"] = str(idea["_id"])
            idea.pop("embedding", None)
        
        return [Idea(**idea) for idea in ideas]
        
    except Exception as e:
        logger.error(f"Error fetching ideas: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch ideas")


@router.get("/{idea_id}", response_model=Idea)
async def get_idea(
    idea_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific idea"""
    try:
        ideas_collection = get_collection("ideas")
        idea = await ideas_collection.find_one({
            "_id": ObjectId(idea_id),
            "user_id": current_user.id
        })
        
        if not idea:
            raise HTTPException(status_code=404, detail="Idea not found")
        
        # Convert ObjectId to string and remove embedding
        if "_id" in idea:
            idea["_id"] = str(idea["_id"])
        idea.pop("embedding", None)
        
        return Idea(**idea)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching idea: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch idea")


@router.put("/{idea_id}", response_model=Idea)
async def update_idea(
    idea_id: str,
    idea_update: IdeaUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an idea"""
    try:
        ideas_collection = get_collection("ideas")
        
        # Check if idea exists and belongs to user
        existing_idea = await ideas_collection.find_one({
            "_id": ObjectId(idea_id),
            "user_id": current_user.id
        })
        
        if not existing_idea:
            raise HTTPException(status_code=404, detail="Idea not found")
        
        # Prepare update data
        update_data = {k: v for k, v in idea_update.dict().items() if v is not None}
        
        # If content is updated, regenerate embedding and novelty score
        if "content" in update_data:
            embedding = await embedding_service.generate_embedding(update_data["content"])
            
            # Get existing ideas for novelty calculation
            existing_ideas = await ideas_collection.find({
                "user_id": current_user.id,
                "_id": {"$ne": ObjectId(idea_id)}
            }).to_list(1000)
            existing_embeddings = [idea.get("embedding", []) for idea in existing_ideas if idea.get("embedding")]
            
            # Calculate novelty score
            novelty_result = await novelty_service.calculate_novelty_score(embedding, existing_embeddings)
            
            update_data["embedding"] = embedding
            update_data["novelty_score"] = novelty_result["novelty_score"]
            update_data["similar_ideas"] = [str(sim["index"]) for sim in novelty_result["similar_ideas"]]
        
        update_data["updated_at"] = datetime.utcnow()
        
        # Update the idea
        await ideas_collection.update_one(
            {"_id": ObjectId(idea_id)},
            {"$set": update_data}
        )
        
        # Fetch updated idea
        updated_idea = await ideas_collection.find_one({"_id": ObjectId(idea_id)})
        
        # Convert ObjectId to string and remove embedding
        if "_id" in updated_idea:
            updated_idea["_id"] = str(updated_idea["_id"])
        updated_idea.pop("embedding", None)
        
        return Idea(**updated_idea)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating idea: {e}")
        raise HTTPException(status_code=500, detail="Failed to update idea")


@router.delete("/{idea_id}")
async def delete_idea(
    idea_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an idea"""
    try:
        ideas_collection = get_collection("ideas")
        
        # Check if idea exists and belongs to user
        existing_idea = await ideas_collection.find_one({
            "_id": ObjectId(idea_id),
            "user_id": current_user.id
        })
        
        if not existing_idea:
            raise HTTPException(status_code=404, detail="Idea not found")
        
        # Delete the idea
        await ideas_collection.delete_one({"_id": ObjectId(idea_id)})
        
        return {"message": "Idea deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting idea: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete idea")


@router.post("/upload", response_model=Idea)
async def upload_idea_file(
    file: UploadFile = File(...),
    title: str = Form(...),
    tags: str = Form(""),
    current_user: User = Depends(get_current_user)
):
    """Upload and process a file as an idea"""
    try:
        # Read file content
        content = await file.read()
        
        # For text files, decode content
        if file.content_type and file.content_type.startswith("text/"):
            text_content = content.decode("utf-8")
        else:
            # For other file types, create a description
            text_content = f"Uploaded file: {file.filename} (Type: {file.content_type})"
        
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
        
        # Create idea data
        idea_data = IdeaCreate(
            title=title,
            content=text_content,
            idea_type="text",
            tags=tag_list,
            metadata={"filename": file.filename, "content_type": file.content_type}
        )
        
        # Create the idea
        return await create_idea(idea_data, current_user)
        
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file")


@router.get("/search/{query}")
async def search_ideas(
    query: str,
    current_user: User = Depends(get_current_user)
):
    """Search ideas using semantic similarity"""
    try:
        # Generate embedding for search query
        query_embedding = await embedding_service.generate_embedding(query)
        
        ideas_collection = get_collection("ideas")
        user_ideas = await ideas_collection.find({"user_id": current_user.id}).to_list(1000)
        
        # Calculate similarities
        results = []
        for idea in user_ideas:
            if idea.get("embedding"):
                similarity = embedding_service.calculate_similarity(
                    query_embedding, idea["embedding"]
                )
                results.append({
                    "idea": Idea(**idea),
                    "similarity": similarity
                })
        
        # Sort by similarity
        results.sort(key=lambda x: x["similarity"], reverse=True)
        
        return results[:20]  # Return top 20 results
        
    except Exception as e:
        logger.error(f"Error searching ideas: {e}")
        raise HTTPException(status_code=500, detail="Failed to search ideas")


@router.post("/voice/transcribe")
async def transcribe_voice_idea(
    audio_file: UploadFile = File(...),
    language: str = Form("en-US"),
    current_user: User = Depends(get_current_user)
):
    """Transcribe voice input to text for creating an idea"""
    try:
        # Validate file type
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Save uploaded file temporarily
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Transcribe audio
            transcription_result = await voice_service.transcribe_audio_file(
                temp_file_path, 
                language
            )
            
            if not transcription_result["success"]:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Transcription failed: {transcription_result.get('error', 'Unknown error')}"
                )
            
            # Return transcription result
            return {
                "text": transcription_result["text"],
                "language": transcription_result["language"],
                "confidence": transcription_result["confidence"],
                "duration": transcription_result["duration"],
                "suggested_title": transcription_result["text"][:50] + "..." if len(transcription_result["text"]) > 50 else transcription_result["text"]
            }
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing voice: {e}")
        raise HTTPException(status_code=500, detail="Failed to transcribe voice")


@router.post("/voice/create")
async def create_voice_idea(
    audio_file: UploadFile = File(...),
    language: str = Form("en-US"),
    title: str = Form(""),
    tags: str = Form(""),
    current_user: User = Depends(get_current_user)
):
    """Create an idea from voice input"""
    try:
        # Validate file type
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Save uploaded file temporarily
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Transcribe audio
            transcription_result = await voice_service.transcribe_audio_file(
                temp_file_path, 
                language
            )
            
            if not transcription_result["success"]:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Transcription failed: {transcription_result.get('error', 'Unknown error')}"
                )
            
            # Create idea from transcription
            idea_data = IdeaCreate(
                title=title or (transcription_result["text"][:50] + "..." if len(transcription_result["text"]) > 50 else transcription_result["text"]),
                content=transcription_result["text"],
                idea_type="voice",
                tags=[tag.strip() for tag in tags.split(",") if tag.strip()],
                metadata={
                    "language": transcription_result["language"],
                    "confidence": transcription_result["confidence"],
                    "duration": transcription_result["duration"],
                    "transcription_method": "voice_service"
                }
            )
            
            # Generate embedding for the idea
            embedding = await embedding_service.generate_embedding(idea_data.content)
            
            # Get existing ideas for novelty calculation
            ideas_collection = get_collection("ideas")
            existing_ideas = await ideas_collection.find({"user_id": current_user.id}).to_list(1000)
            existing_embeddings = [idea.get("embedding", []) for idea in existing_ideas if idea.get("embedding")]
            
            # Calculate novelty score
            novelty_result = await novelty_service.calculate_novelty_score(embedding, existing_embeddings)
            
            # Create idea document
            idea_doc = {
                "title": idea_data.title,
                "content": idea_data.content,
                "idea_type": idea_data.idea_type,
                "tags": idea_data.tags,
                "metadata": idea_data.metadata,
                "embedding": embedding,
                "novelty_score": novelty_result["novelty_score"],
                "user_id": current_user.id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert idea
            result = await ideas_collection.insert_one(idea_doc)
            idea_doc["_id"] = str(result.inserted_id)
            
            # Remove embedding from response (too large)
            del idea_doc["embedding"]
            
            return Idea(**idea_doc)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating voice idea: {e}")
        raise HTTPException(status_code=500, detail="Failed to create voice idea")


@router.get("/voice/languages")
async def get_supported_languages():
    """Get list of supported languages for voice transcription"""
    try:
        languages = voice_service.get_supported_languages()
        return {"languages": languages}
    except Exception as e:
        logger.error(f"Error getting supported languages: {e}")
        raise HTTPException(status_code=500, detail="Failed to get supported languages")
