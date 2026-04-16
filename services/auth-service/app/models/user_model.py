from datetime import datetime, timezone


def build_user_document(payload, password_hash: str) -> dict:
    return {
        "fullName": payload.fullName.strip(),
        "email": payload.email.lower(),
        "passwordHash": password_hash,
        "role": payload.role,
        "createdAt": datetime.now(timezone.utc),
    }


def serialize_user(user_document: dict) -> dict:
    return {
        "userId": str(user_document["_id"]),
        "fullName": user_document["fullName"],
        "email": user_document["email"],
        "role": user_document["role"],
    }