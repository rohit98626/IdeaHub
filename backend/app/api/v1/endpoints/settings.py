"""
Settings API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from typing import Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId
import json
import io

from app.models.settings import UserSettings, UserSettingsUpdate, DataExportRequest
from app.models.user import User
from app.core.database import get_collection
from .users import get_current_user

router = APIRouter()


@router.get("/", response_model=UserSettings)
async def get_user_settings(current_user: User = Depends(get_current_user)):
    """Get user settings"""
    try:
        settings_collection = get_collection("user_settings")
        
        # Find user settings
        settings = await settings_collection.find_one({"user_id": current_user.id})
        
        if not settings:
            # Create default settings if none exist
            default_settings = {
                "user_id": current_user.id,
                "preferences": {
                    "theme": "light",
                    "language": "en",
                    "notifications": True,
                    "voiceInput": True,
                    "imageUpload": True,
                    "autoClustering": False
                },
                "privacy": {
                    "dataSharing": False,
                    "analytics": True,
                    "publicProfile": False
                },
                "api_keys": {
                    "gemini_api_key": "",
                    "openai_api_key": ""
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            result = await settings_collection.insert_one(default_settings)
            default_settings["_id"] = str(result.inserted_id)
            return UserSettings(**default_settings)
        
        settings["_id"] = str(settings["_id"])
        return UserSettings(**settings)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get user settings")


@router.put("/", response_model=UserSettings)
async def update_user_settings(
    settings_update: UserSettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update user settings"""
    try:
        settings_collection = get_collection("user_settings")
        
        # Prepare update data
        update_data = {k: v for k, v in settings_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        # Update or create settings
        result = await settings_collection.update_one(
            {"user_id": current_user.id},
            {"$set": update_data},
            upsert=True
        )
        
        # Fetch updated settings
        updated_settings = await settings_collection.find_one({"user_id": current_user.id})
        updated_settings["_id"] = str(updated_settings["_id"])
        
        return UserSettings(**updated_settings)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update user settings")


@router.post("/export")
async def export_user_data(
    export_request: DataExportRequest,
    current_user: User = Depends(get_current_user)
):
    """Export user data"""
    try:
        export_data = {
            "user_info": {
                "username": current_user.username,
                "email": current_user.email,
                "full_name": current_user.full_name,
                "created_at": current_user.created_at.isoformat(),
                "export_date": datetime.utcnow().isoformat()
            }
        }
        
        # Get user settings
        if export_request.include_settings:
            settings_collection = get_collection("user_settings")
            settings = await settings_collection.find_one({"user_id": current_user.id})
            if settings:
                del settings["_id"]
                export_data["settings"] = settings
        
        # Get ideas
        if export_request.include_ideas:
            ideas_collection = get_collection("ideas")
            ideas = await ideas_collection.find({"user_id": current_user.id}).to_list(None)
            for idea in ideas:
                idea["_id"] = str(idea["_id"])
            export_data["ideas"] = ideas
        
        # Get clusters
        if export_request.include_clusters:
            clusters_collection = get_collection("clusters")
            clusters = await clusters_collection.find({"user_id": current_user.id}).to_list(None)
            for cluster in clusters:
                cluster["_id"] = str(cluster["_id"])
            export_data["clusters"] = clusters
        
        # Get innovation results
        if export_request.include_innovations:
            innovations_collection = get_collection("innovation_results")
            innovations = await innovations_collection.find({"user_id": current_user.id}).to_list(None)
            for innovation in innovations:
                innovation["_id"] = str(innovation["_id"])
            export_data["innovation_results"] = innovations
        
        # Return data based on format
        if export_request.format == "json":
            return JSONResponse(content=export_data)
        elif export_request.format == "csv":
            # Simple CSV export for ideas
            csv_content = "id,title,content,novelty_score,created_at\n"
            if "ideas" in export_data:
                for idea in export_data["ideas"]:
                    csv_content += f"{idea['_id']},{idea['title']},{idea['content']},{idea.get('novelty_score', 0)},{idea['created_at']}\n"
            
            return StreamingResponse(
                io.BytesIO(csv_content.encode()),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=idea_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
            )
        else:
            return JSONResponse(content=export_data)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to export user data")


@router.delete("/account")
async def delete_user_account(current_user: User = Depends(get_current_user)):
    """Delete user account and all associated data"""
    try:
        # Get all collections
        ideas_collection = get_collection("ideas")
        clusters_collection = get_collection("clusters")
        innovations_collection = get_collection("innovation_results")
        settings_collection = get_collection("user_settings")
        users_collection = get_collection("users")
        
        # Delete all user data
        await ideas_collection.delete_many({"user_id": current_user.id})
        await clusters_collection.delete_many({"user_id": current_user.id})
        await innovations_collection.delete_many({"user_id": current_user.id})
        await settings_collection.delete_many({"user_id": current_user.id})
        
        # Delete user account
        await users_collection.delete_one({"_id": ObjectId(current_user.id)})
        
        return {"message": "Account and all associated data deleted successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete account")


@router.post("/change-password")
async def change_password(
    password_data: dict,
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    try:
        from passlib.context import CryptContext
        
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        users_collection = get_collection("users")
        
        # Get current user with password hash
        user = await users_collection.find_one({"_id": ObjectId(current_user.id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        if not pwd_context.verify(password_data["current_password"], user["hashed_password"]):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Hash new password
        hashed_password = pwd_context.hash(password_data["new_password"])
        
        # Update password
        await users_collection.update_one(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"hashed_password": hashed_password, "updated_at": datetime.utcnow()}}
        )
        
        return {"message": "Password changed successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to change password")


@router.get("/stats")
async def get_user_statistics(current_user: User = Depends(get_current_user)):
    """Get detailed user statistics"""
    try:
        ideas_collection = get_collection("ideas")
        clusters_collection = get_collection("clusters")
        innovations_collection = get_collection("innovation_results")
        
        # Count documents
        idea_count = await ideas_collection.count_documents({"user_id": current_user.id})
        cluster_count = await clusters_collection.count_documents({"user_id": current_user.id})
        innovation_count = await innovations_collection.count_documents({"user_id": current_user.id})
        
        # Get average novelty score
        pipeline = [
            {"$match": {"user_id": current_user.id, "novelty_score": {"$exists": True}}},
            {"$group": {"_id": None, "avg_novelty": {"$avg": "$novelty_score"}}}
        ]
        novelty_result = await ideas_collection.aggregate(pipeline).to_list(1)
        avg_novelty = novelty_result[0]["avg_novelty"] if novelty_result else 0.0
        
        # Get innovation type breakdown
        innovation_pipeline = [
            {"$match": {"user_id": current_user.id}},
            {"$group": {"_id": "$type", "count": {"$sum": 1}}}
        ]
        innovation_types = await innovations_collection.aggregate(innovation_pipeline).to_list(None)
        
        # Get recent activity (last 7 days)
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_ideas = await ideas_collection.count_documents({
            "user_id": current_user.id,
            "created_at": {"$gte": week_ago}
        })
        recent_innovations = await innovations_collection.count_documents({
            "user_id": current_user.id,
            "created_at": {"$gte": week_ago}
        })
        
        return {
            "total_ideas": idea_count,
            "total_clusters": cluster_count,
            "total_innovations": innovation_count,
            "average_novelty_score": round(avg_novelty, 3),
            "innovation_types": {item["_id"]: item["count"] for item in innovation_types},
            "recent_activity": {
                "ideas_last_week": recent_ideas,
                "innovations_last_week": recent_innovations
            },
            "user_since": current_user.created_at
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to get user statistics")
