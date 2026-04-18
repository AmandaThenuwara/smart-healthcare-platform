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
from app.db.mongodb import get_notifications_collection

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


def require_roles(*allowed_roles: str):
    def role_checker(current_user=Depends(get_current_user)):
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource",
            )
        return current_user

    return role_checker


def ensure_user_owner_or_admin(target_user_id: str, current_user: dict):
    if current_user.get("role") == "ADMIN":
        return

    if str(target_user_id) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access these notifications",
        )


def ensure_notification_owner_or_admin(notification_id: str, current_user: dict):
    try:
        object_id = ObjectId(notification_id)
    except (InvalidId, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        ) from exc

    notification = get_notifications_collection().find_one({"_id": object_id})
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    ensure_user_owner_or_admin(notification.get("userId"), current_user)
    return notification
