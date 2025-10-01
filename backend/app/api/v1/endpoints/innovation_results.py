from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
import io

from app.models.innovation import InnovationResult, InnovationResultCreate, InnovationResultUpdate
from app.models.user import User
from app.core.database import get_collection
from app.services.pdf_service import pdf_service
from .users import get_current_user

router = APIRouter()


@router.post("/", response_model=InnovationResult)
async def create_innovation_result(
    innovation_data: InnovationResultCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new innovation result"""
    try:
        results_collection = get_collection("innovation_results")
        
        # Convert to dict and add user_id
        result_dict = innovation_data.dict()
        result_dict["user_id"] = current_user.id
        result_dict["created_at"] = datetime.utcnow()
        result_dict["updated_at"] = datetime.utcnow()
        
        # Insert into database
        result = await results_collection.insert_one(result_dict)
        
        # Fetch the created result
        created_result = await results_collection.find_one({"_id": result.inserted_id})
        if created_result:
            created_result["_id"] = str(created_result["_id"])
            return InnovationResult(**created_result)
        else:
            raise HTTPException(status_code=500, detail="Failed to create innovation result")
            
    except Exception as e:
        print(f"Error creating innovation result: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to create innovation result")


@router.get("/", response_model=List[InnovationResult])
async def get_innovation_results(
    type: Optional[str] = Query(None, description="Filter by innovation type"),
    current_user: User = Depends(get_current_user)
):
    """Get user's innovation results"""
    try:
        results_collection = get_collection("innovation_results")
        
        # Build query
        query = {"user_id": current_user.id}
        if type:
            query["type"] = type
        
        cursor = results_collection.find(query).sort("created_at", -1)
        results = await cursor.to_list(1000)
        
        # Convert ObjectIds to strings
        for result in results:
            if "_id" in result:
                result["_id"] = str(result["_id"])
        
        return [InnovationResult(**result) for result in results]
        
    except Exception as e:
        print(f"Error fetching innovation results: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to fetch innovation results")


@router.get("/{result_id}", response_model=InnovationResult)
async def get_innovation_result(
    result_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific innovation result"""
    try:
        results_collection = get_collection("innovation_results")
        
        result = await results_collection.find_one({
            "_id": ObjectId(result_id),
            "user_id": current_user.id
        })
        
        if not result:
            raise HTTPException(status_code=404, detail="Innovation result not found")
        
        result["_id"] = str(result["_id"])
        return InnovationResult(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching innovation result: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to fetch innovation result")


@router.put("/{result_id}", response_model=InnovationResult)
async def update_innovation_result(
    result_id: str,
    update_data: InnovationResultUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an innovation result"""
    try:
        results_collection = get_collection("innovation_results")
        
        # Check if result exists and belongs to user
        existing_result = await results_collection.find_one({
            "_id": ObjectId(result_id),
            "user_id": current_user.id
        })
        
        if not existing_result:
            raise HTTPException(status_code=404, detail="Innovation result not found")
        
        # Prepare update data
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        update_dict["updated_at"] = datetime.utcnow()
        
        # Update the result
        await results_collection.update_one(
            {"_id": ObjectId(result_id)},
            {"$set": update_dict}
        )
        
        # Fetch updated result
        updated_result = await results_collection.find_one({"_id": ObjectId(result_id)})
        if updated_result:
            updated_result["_id"] = str(updated_result["_id"])
            return InnovationResult(**updated_result)
        else:
            raise HTTPException(status_code=500, detail="Failed to update innovation result")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating innovation result: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to update innovation result")


@router.delete("/{result_id}")
async def delete_innovation_result(
    result_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an innovation result"""
    try:
        results_collection = get_collection("innovation_results")
        
        # Check if result exists and belongs to user
        existing_result = await results_collection.find_one({
            "_id": ObjectId(result_id),
            "user_id": current_user.id
        })
        
        if not existing_result:
            raise HTTPException(status_code=404, detail="Innovation result not found")
        
        # Delete the result
        await results_collection.delete_one({"_id": ObjectId(result_id)})
        
        return {"message": "Innovation result deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting innovation result: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to delete innovation result")


@router.get("/stats/summary")
async def get_innovation_stats(current_user: User = Depends(get_current_user)):
    """Get innovation statistics for the user"""
    try:
        results_collection = get_collection("innovation_results")
        
        # Get total count
        total_count = await results_collection.count_documents({"user_id": current_user.id})
        
        # Get count by type
        pipeline = [
            {"$match": {"user_id": current_user.id}},
            {"$group": {"_id": "$type", "count": {"$sum": 1}}}
        ]
        
        type_counts = await results_collection.aggregate(pipeline).to_list(1000)
        type_stats = {item["_id"]: item["count"] for item in type_counts}
        
        # Get recent activity (last 7 days)
        from datetime import timedelta
        week_ago = datetime.utcnow() - timedelta(days=7)
        recent_count = await results_collection.count_documents({
            "user_id": current_user.id,
            "created_at": {"$gte": week_ago}
        })
        
        return {
            "total_innovations": total_count,
            "by_type": type_stats,
            "recent_innovations": recent_count
        }
        
    except Exception as e:
        print(f"Error fetching innovation stats: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to fetch innovation stats")


@router.get("/{result_id}/download")
async def download_innovation_pdf(
    result_id: str,
    current_user: User = Depends(get_current_user)
):
    """Download innovation result as PDF"""
    try:
        results_collection = get_collection("innovation_results")
        
        # Get the innovation result
        result = await results_collection.find_one({
            "_id": ObjectId(result_id),
            "user_id": current_user.id
        })
        
        if not result:
            raise HTTPException(status_code=404, detail="Innovation result not found")
        
        # Convert ObjectId to string for JSON serialization
        result["_id"] = str(result["_id"])
        
        # Get user info for PDF header
        user_info = {
            "username": current_user.username,
            "full_name": getattr(current_user, 'full_name', None) or current_user.username,
            "email": current_user.email
        }
        
        # Generate PDF
        pdf_content = pdf_service.generate_innovation_pdf(result, user_info)
        
        # Create filename
        innovation_type = result.get('type', 'innovation')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{innovation_type}_{timestamp}.pdf"
        
        # Return PDF as streaming response
        return StreamingResponse(
            io.BytesIO(pdf_content),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating PDF: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF")
