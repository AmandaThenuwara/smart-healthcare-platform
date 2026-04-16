from fastapi import APIRouter
from app.core.config import APP_NAME
from app.db.mongodb import get_database

router = APIRouter()

@router.get("/health")
def health_check():
    database = get_database()
    return {
        "status": "ok",
        "service": APP_NAME,
        "database": "connected" if database is not None else "disconnected"
    }
