from pymongo import MongoClient
from app.core.config import (
    MONGO_URI,
    DATABASE_NAME,
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_AUTH_SOURCE,
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


def get_notifications_collection():
    return get_database()["notifications"]


def close_mongo_connection():
    global client
    if client is not None:
        client.close()
