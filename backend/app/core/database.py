"""
Key features:
- Async/await support for non-blocking database operations
- Connection pooling and lifecycle management
- Error handling and logging
- Singleton pattern for global database access
"""

import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

logger = logging.getLogger(__name__)


class Database:
    client: AsyncIOMotorClient = None  # MongoDB async client
    database = None                    # Database instance
    connected: bool = False            # Track connection status


db = Database()


async def connect_to_mongo():
    try:
        # Create Mongo client with timeout to avoid hanging on Render
        db.client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            serverSelectionTimeoutMS=5000  # 5 seconds timeout
        )

        db.database = db.client[settings.DATABASE_NAME]

        # Try to ping MongoDB, but cap wait time to 5 seconds
        await asyncio.wait_for(db.client.admin.command('ping'), timeout=5)

        db.connected = True
        logger.info(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")

    except Exception as e:
        db.connected = False
        logger.error(f"⚠️ MongoDB connection failed: {e}")
        logger.warning("Starting server without active Mongo connection.")


async def close_mongo_connection():
    if db.client:
        db.client.close()
        logger.info("🔌 Disconnected from MongoDB")


def get_database():
    if not db.connected:
        logger.warning("⚠️ Attempted to access database while disconnected.")
    return db.database


def get_collection(collection_name: str):
    if not db.connected:
        logger.warning(f"⚠️ Attempted to access collection '{collection_name}' while disconnected.")
    return db.database[collection_name]
