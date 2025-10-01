"""
Settings models for user preferences and configuration
"""

from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, field=None):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str):
            if ObjectId.is_valid(v):
                return ObjectId(v)
            raise ValueError("Invalid ObjectId string")
        raise ValueError("Invalid ObjectId type")

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema: Dict[str, Any]):
        field_schema.update(type="string")
        return field_schema


class UserSettings(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    user_id: str
    preferences: Dict[str, Any] = Field(default_factory=dict)
    privacy: Dict[str, Any] = Field(default_factory=dict)
    api_keys: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
        json_schema_extra = {
            "example": {
                "user_id": "60c728b2f9b1c2a3b4c5d6e7",
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
                "created_at": "2023-10-27T10:00:00Z",
                "updated_at": "2023-10-27T10:00:00Z"
            }
        }


class UserSettingsUpdate(BaseModel):
    preferences: Optional[Dict[str, Any]] = None
    privacy: Optional[Dict[str, Any]] = None
    api_keys: Optional[Dict[str, Any]] = None

    class Config:
        populate_by_name = True


class DataExportRequest(BaseModel):
    include_ideas: bool = True
    include_clusters: bool = True
    include_innovations: bool = True
    include_settings: bool = True
    format: str = "json"  # json, csv, pdf

    class Config:
        populate_by_name = True