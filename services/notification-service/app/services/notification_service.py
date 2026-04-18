from bson import ObjectId
from fastapi import HTTPException, status

from app.db.mongodb import get_notifications_collection
from app.models.notification_model import build_notification_document, serialize_notification


def ensure_notification_indexes():
    get_notifications_collection().create_index("userId")
    get_notifications_collection().create_index("createdAt")
    get_notifications_collection().create_index("isRead")


def create_notification(payload):
    result = get_notifications_collection().insert_one(build_notification_document(payload))
    created = get_notifications_collection().find_one({"_id": result.inserted_id})
    return serialize_notification(created)


def list_notifications(user_id: str):
    cursor = get_notifications_collection().find({"userId": user_id}).sort(
        [("createdAt", -1)]
    )
    return [serialize_notification(doc) for doc in cursor]


def mark_notification_read_state(notification_id: str, is_read: bool):
    result = get_notifications_collection().update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"isRead": is_read}},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")

    updated = get_notifications_collection().find_one({"_id": ObjectId(notification_id)})
    return serialize_notification(updated)


def mark_all_notifications_as_read(user_id: str) -> int:
    result = get_notifications_collection().update_many(
        {"userId": user_id, "isRead": False},
        {"$set": {"isRead": True}},
    )
    return result.modified_count
