from fastapi import FastAPI
from app.core.config import APP_NAME
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.api.router import api_router
from app.services.patient_service import ensure_patient_indexes

app = FastAPI(title=APP_NAME)


@app.on_event("startup")
def startup_event():
    connect_to_mongo()
    ensure_patient_indexes()


@app.on_event("shutdown")
def shutdown_event():
    close_mongo_connection()


app.include_router(api_router)
