"""
Configuration settings for the Idea Innovation Hub
"""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "idea_innovation_hub"
    
    SECRET_KEY: str = "your-secret-key-here"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    API_V1_STR: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    MAX_FILE_SIZE: int = 10485760
    UPLOAD_DIRECTORY: str = "./uploads"
    
    SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"
    CLUSTERING_ALGORITHM: str = "kmeans"
    MAX_CLUSTERS: int = 10
    
    NOVELTY_THRESHOLD: float = 0.7
    SIMILARITY_THRESHOLD: float = 0.8
    
    VOICE_TIMEOUT: int = 10
    VOICE_PHRASE_TIMEOUT: float = 0.3
    
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()