from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.security import hash_password, verify_password, create_access_token
from app.db.mongodb import get_users_collection
from app.models.user_model import build_user_document, serialize_user


def ensure_user_indexes():
    get_users_collection().create_index("email", unique=True)


def register_user(payload):
    users_collection = get_users_collection()

    existing_user = users_collection.find_one({"email": payload.email.lower()})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        )

    password_hash = hash_password(payload.password)
    user_document = build_user_document(payload, password_hash)

    try:
        result = users_collection.insert_one(user_document)
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered",
        ) from exc

    created_user = users_collection.find_one({"_id": result.inserted_id})

    return {
        "message": "User registered successfully",
        "userId": str(created_user["_id"]),
        "role": created_user["role"],
    }


def login_user(payload):
    users_collection = get_users_collection()

    user = users_collection.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["passwordHash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    serialized_user = serialize_user(user)
    access_token = create_access_token(
        {
            "sub": serialized_user["userId"],
            "email": serialized_user["email"],
            "role": serialized_user["role"],
        }
    )

    return {
        "accessToken": access_token,
        "tokenType": "bearer",
        "user": serialized_user,
    }


def get_profile(current_user):
    return serialize_user(current_user)