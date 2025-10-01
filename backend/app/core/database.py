"""
Key features:
- Async/await support for non-blocking database operations
- Connection pooling and lifecycle management
- Error handling and logging
- Singleton pattern for global database access
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None  # MongoDB async client
    database = None                    # Database instance


db = Database()


async def connect_to_mongo():
    try:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        db.database = db.client[settings.DATABASE_NAME]
        
        await db.client.admin.command('ping')
        
        logger.info(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")
        
    except Exception as e:
        logger.error(f"❌ Could not connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    if db.client:
        db.client.close()
        logger.info("🔌 Disconnected from MongoDB")

def get_database():
    return db.database

def get_collection(collection_name: str):
    return db.database[collection_name]