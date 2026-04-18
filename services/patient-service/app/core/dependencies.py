from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo import MongoClient

from app.core.config import (
    MONGO_URI,
    MONGO_USERNAME,
    MONGO_PASSWORD,
    MONGO_AUTH_SOURCE,
)
from app.core.security import decode_access_token
from app.db.mongodb import get_patients_collection

bearer_scheme = HTTPBearer(auto_error=True)

_auth_client = MongoClient(
    MONGO_URI,
    username=MONGO_USERNAME,
    password=MONGO_PASSWORD,
    authSource=MONGO_AUTH_SOURCE,
)
_auth_users_collection = _auth_client["auth_db"]["users"]


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    token = credentials.credentials
    payload = decode_access_token(token)

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        object_id = ObjectId(user_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
        ) from exc

    user = _auth_users_collection.find_one({"_id": object_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def get_current_user_id(current_user=Depends(get_current_user)) -> str:
    return str(current_user["_id"])


def require_roles(*allowed_roles: str):
    def role_checker(current_user=Depends(get_current_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )
        return current_user

    return role_checker


def ensure_resource_owner_or_admin(resource_user_id: str, current_user: dict):
    if current_user.get("role") == "ADMIN":
        return

    if str(resource_user_id) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this resource",
        )


def get_current_patient_profile_id(current_user: dict) -> str:
    profile = get_patients_collection().find_one({"userId": str(current_user["_id"])})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found for current user",
        )
    return str(profile["_id"])


def ensure_patient_owner_or_admin(patient_id: str, current_user: dict):
    if current_user.get("role") == "ADMIN":
        return

    current_patient_id = get_current_patient_profile_id(current_user)
    if str(patient_id) != current_patient_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this patient's data",
        )
