import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env", override=True, encoding="utf-8")

APP_NAME = os.getenv("APP_NAME", "auth-service")
PORT = int(os.getenv("PORT", 8001))

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27018")
DATABASE_NAME = os.getenv("DATABASE_NAME", "auth_db")
MONGO_USERNAME = os.getenv("MONGO_USERNAME", "")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD", "")
MONGO_AUTH_SOURCE = os.getenv("MONGO_AUTH_SOURCE", "admin")

JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_change_this_before_production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 60))