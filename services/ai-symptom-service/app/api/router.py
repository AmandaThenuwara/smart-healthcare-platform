from fastapi import APIRouter

from app.api.routes.health import router as health_router
from app.api.routes.root import router as root_router
from app.api.routes.symptom import router as symptom_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(root_router)
api_router.include_router(health_router)
api_router.include_router(symptom_router)
