from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.core.config import APP_NAME
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.api.router import api_router
from app.services.telemedicine_service import ensure_session_indexes

app = FastAPI(title=APP_NAME)

# CORS is handled by Nginx at the gateway level


@app.on_event("startup")
def startup_event():
    connect_to_mongo()
    ensure_session_indexes()


@app.on_event("shutdown")
def shutdown_event():
    close_mongo_connection()


app.include_router(api_router)
