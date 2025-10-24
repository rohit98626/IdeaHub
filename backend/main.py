"""
Idea Innovation Hub - Backend API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api.v1.api import api_router
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔄 Connecting to Mongo...")
    try:
        await connect_to_mongo()
        print("✅ Mongo connected")
        yield
    except Exception as e:
        print("❌ Mongo connection failed:", e)
        yield
    finally:
        await close_mongo_connection()
        print("🔚 Mongo connection closed")



app = FastAPI(
    title="Idea Innovation Hub API",
    description="A personal innovation partner that transforms scattered thoughts into creative ideas",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
async def root():
    return {
        "message": "Welcome to Idea Innovation Hub API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",   # always listen on 0.0.0.0 in cloud
        port=int(os.environ.get("PORT", 8000)),  # Render sets PORT
        reload=settings.DEBUG
    )