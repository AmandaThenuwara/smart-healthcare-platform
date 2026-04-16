from fastapi import APIRouter

from app.schemas.notification_schema import NotificationCreate, NotificationResponse
from app.services.notification_service import create_notification, list_notifications

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("", response_model=NotificationResponse, status_code=201)
def create_new_notification(payload: NotificationCreate):
    return create_notification(payload)


@router.get("/user/{user_id}", response_model=list[NotificationResponse])
def get_user_notifications(user_id: str):
    return list_notifications(user_id)
