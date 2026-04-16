from fastapi import FastAPI
from app.core.config import APP_NAME
from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database

app = FastAPI(title=APP_NAME)

@app.on_event("startup")
def startup_event():
    connect_to_mongo()

@app.on_event("shutdown")
def shutdown_event():
    close_mongo_connection()

@app.get("/health")
def health_check():
    database = get_database()
    return {
        "status": "ok",
        "service": APP_NAME,
        "database": "connected" if database is not None else "disconnected"
    }
