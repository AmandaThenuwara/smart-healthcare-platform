from app.db.mongodb import get_notifications_collection
from app.models.notification_model import build_notification_document, serialize_notification


def ensure_notification_indexes():
    get_notifications_collection().create_index("userId")


def create_notification(payload):
    result = get_notifications_collection().insert_one(build_notification_document(payload))
    created = get_notifications_collection().find_one({"_id": result.inserted_id})
    return serialize_notification(created)


def list_notifications(user_id: str):
    cursor = get_notifications_collection().find({"userId": user_id}).sort([("createdAt", -1)])
    return [serialize_notification(doc) for doc in cursor]
