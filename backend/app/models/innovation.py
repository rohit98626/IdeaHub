from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId


class InnovationResult(BaseModel):
    """Innovation result schema for storing generated combinations, expansions, and suggestions"""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    type: str = Field(..., description="Type of innovation: combination, expansion, or suggestions")
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    
    # For combinations
    source_idea_ids: Optional[List[str]] = Field(None, description="IDs of source ideas used")
    combination_type: Optional[str] = Field(None, description="Type of combination: creative, practical, etc.")
    novelty_score: Optional[float] = Field(None, ge=0, le=1, description="Novelty score 0-1")
    expansion_suggestions: Optional[List[str]] = Field(None, description="List of expansion suggestions")
    
    # For expansions
    source_idea_id: Optional[str] = Field(None, description="ID of source idea expanded")
    expansion_type: Optional[str] = Field(None, description="Type of expansion: technical, business, etc.")
    feasibility_score: Optional[float] = Field(None, ge=0, le=1, description="Feasibility score 0-1")
    
    # For suggestions
    suggestions: Optional[List[Dict[str, Any]]] = Field(None, description="Structured suggestions")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class InnovationResultCreate(BaseModel):
    """Schema for creating innovation results"""
    type: str
    title: str
    content: str
    source_idea_ids: Optional[List[str]] = None
    combination_type: Optional[str] = None
    novelty_score: Optional[float] = None
    expansion_suggestions: Optional[List[str]] = None
    source_idea_id: Optional[str] = None
    expansion_type: Optional[str] = None
    feasibility_score: Optional[float] = None
    suggestions: Optional[List[Dict[str, Any]]] = None


class InnovationResultUpdate(BaseModel):
    """Schema for updating innovation results"""
    title: Optional[str] = None
    content: Optional[str] = None
    expansion_suggestions: Optional[List[str]] = None
    suggestions: Optional[List[Dict[str, Any]]] = None