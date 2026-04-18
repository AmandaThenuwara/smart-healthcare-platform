from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import APP_NAME, UPLOAD_DIR
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.api.router import api_router
from app.services.patient_service import ensure_patient_indexes

app = FastAPI(title=APP_NAME)

_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def startup_event():
    connect_to_mongo()
    ensure_patient_indexes()


@app.on_event("shutdown")
def shutdown_event():
    close_mongo_connection()


app.include_router(api_router)
