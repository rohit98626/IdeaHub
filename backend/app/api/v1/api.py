"""
API v1 router configuration
"""

from fastapi import APIRouter
from app.api.v1.endpoints import ideas, users, clusters, innovation, innovation_results, settings

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(ideas.router, prefix="/ideas", tags=["ideas"])
api_router.include_router(clusters.router, prefix="/clusters", tags=["clusters"])
api_router.include_router(innovation.router, prefix="/innovation", tags=["innovation"])
api_router.include_router(innovation_results.router, prefix="/innovation-results", tags=["innovation-results"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])