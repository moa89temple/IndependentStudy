from fastapi import APIRouter
from app.api import courses, materials, learning, interactions

api_router = APIRouter(prefix="/api")
api_router.include_router(courses.router, prefix="/courses", tags=["courses"])
api_router.include_router(materials.router, prefix="/courses", tags=["materials"])
api_router.include_router(learning.router, prefix="/courses", tags=["learning"])
api_router.include_router(interactions.router, prefix="", tags=["interactions"])
