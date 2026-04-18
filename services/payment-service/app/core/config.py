import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
# load_dotenv(BASE_DIR / ".env", override=True, encoding="utf-8")

APP_NAME = os.getenv("APP_NAME", "payment-service")
PORT = int(os.getenv("PORT", 8006))

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27018")
DATABASE_NAME = os.getenv("DATABASE_NAME", "payment_db")
MONGO_USERNAME = os.getenv("MONGO_USERNAME", "")
MONGO_PASSWORD = os.getenv("MONGO_PASSWORD", "")
MONGO_AUTH_SOURCE = os.getenv("MONGO_AUTH_SOURCE", "admin")

JWT_SECRET = os.getenv("JWT_SECRET", "super_secret_change_this_before_production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

# First check for the environment variable, then try to detect if we are in production
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL")
if not FRONTEND_BASE_URL:
    # If not set, use the production Vercel URL as the safety default
    FRONTEND_BASE_URL = "https://smart-healthcare-platform-85if.vercel.app"
    
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")