from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.root import router as root_router
from app.api.routes.patient import router as patient_router
from app.api.routes.reports import router as reports_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(root_router)
api_router.include_router(health_router)
api_router.include_router(patient_router)
api_router.include_router(reports_router)
