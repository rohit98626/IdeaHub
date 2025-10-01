"""
Idea model and schemas
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum


class IdeaType(str, Enum):
    TEXT = "text"
    VOICE = "voice"
    IMAGE = "image"
    COMBINED = "combined"


class IdeaStatus(str, Enum):
    DRAFT = "draft"
    PROCESSED = "processed"
    CLUSTERED = "clustered"
    EXPANDED = "expanded"


class IdeaBase(BaseModel):
    """Base idea schema"""
    title: str = Field(..., min_length=1, max_length=200)
    content: str = Field(..., min_length=1)
    idea_type: IdeaType = IdeaType.TEXT
    tags: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class IdeaCreate(IdeaBase):
    """Schema for creating a new idea"""
    pass


class IdeaUpdate(BaseModel):
    """Schema for updating an idea"""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None


class Idea(IdeaBase):
    """Complete idea schema"""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    status: IdeaStatus = IdeaStatus.DRAFT
    novelty_score: Optional[float] = Field(None, ge=0, le=1)
    cluster_id: Optional[str] = None
    embedding: Optional[List[float]] = None
    similar_ideas: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class IdeaCluster(BaseModel):
    """Idea cluster schema"""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    idea_ids: List[str] = Field(default_factory=list)
    idea_count: Optional[int] = Field(None)
    ideas: Optional[List[Idea]] = Field(None)
    centroid_embedding: Optional[List[float]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class IdeaCombination(BaseModel):
    """Generated idea combination schema"""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    source_idea_ids: List[str] = Field(..., min_items=2)
    combined_content: str
    novelty_score: Optional[float] = Field(None, ge=0, le=1)
    expansion_suggestions: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


class IdeaExpansion(BaseModel):
    """Idea expansion schema"""
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    source_idea_id: str
    expansion_type: str = Field(..., min_length=1)  # e.g., "mobile_app", "research_paper", "startup"
    expanded_content: str
    feasibility_score: Optional[float] = Field(None, ge=0, le=1)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
