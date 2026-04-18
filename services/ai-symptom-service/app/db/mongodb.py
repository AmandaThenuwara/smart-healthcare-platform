from pymongo import MongoClient

from app.core.config import (
    DATABASE_NAME,
    MONGO_AUTH_SOURCE,
    MONGO_PASSWORD,
    MONGO_URI,
    MONGO_USERNAME,
)

client = None
db = None


def connect_to_mongo():
    global client, db

    client = MongoClient(
        MONGO_URI,
        username=MONGO_USERNAME,
        password=MONGO_PASSWORD,
        authSource=MONGO_AUTH_SOURCE,
    )

    client.admin.command("ping")
    db = client[DATABASE_NAME]
    return db


def get_database():
    return db


def get_symptom_checks_collection():
    return get_database()["symptom_checks"]


def close_mongo_connection():
    global client
    if client is not None:
        client.close()
