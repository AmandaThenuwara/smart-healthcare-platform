from datetime import datetime, timezone


def build_notification_document(payload) -> dict:
    return {
        "userId": payload.userId,
        "title": payload.title.strip(),
        "message": payload.message.strip(),
        "type": payload.type,
        "isRead": False,
        "createdAt": datetime.now(timezone.utc),
    }


def serialize_notification(document: dict) -> dict:
    return {
        "notificationId": str(document["_id"]),
        "userId": document["userId"],
        "title": document["title"],
        "message": document["message"],
        "type": document["type"],
        "isRead": document["isRead"],
        "createdAt": document["createdAt"].isoformat() if hasattr(document["createdAt"], "isoformat") else str(document["createdAt"]),
    }
