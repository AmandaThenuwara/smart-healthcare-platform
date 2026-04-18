from fastapi import APIRouter, Depends, status

from app.core.dependencies import (
    ensure_notification_owner_or_admin,
    ensure_user_owner_or_admin,
    require_roles,
)
from app.schemas.notification_schema import (
    BulkReadResponse,
    NotificationCreate,
    NotificationReadUpdate,
    NotificationResponse,
)
from app.services.notification_service import (
    create_notification,
    list_notifications,
    mark_all_notifications_as_read,
    mark_notification_read_state,
)

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_new_notification(
    payload: NotificationCreate,
    current_user=Depends(require_roles("PATIENT", "DOCTOR", "ADMIN")),
):
    if current_user.get("role") == "ADMIN":
        return create_notification(payload)

    enforced_payload = NotificationCreate(
        **payload.model_dump(exclude={"userId"}),
        userId=str(current_user["_id"]),
    )
    return create_notification(enforced_payload)


@router.get("/user/{user_id}", response_model=list[NotificationResponse])
def get_user_notifications(
    user_id: str,
    current_user=Depends(require_roles("PATIENT", "DOCTOR", "ADMIN")),
):
    ensure_user_owner_or_admin(user_id, current_user)
    return list_notifications(user_id)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: str,
    payload: NotificationReadUpdate,
    current_user=Depends(require_roles("PATIENT", "DOCTOR", "ADMIN")),
):
    notification = ensure_notification_owner_or_admin(notification_id, current_user)
    return mark_notification_read_state(notification["notificationId"], payload.isRead)


@router.post("/user/{user_id}/read-all", response_model=BulkReadResponse)
def read_all_notifications(
    user_id: str,
    current_user=Depends(require_roles("PATIENT", "DOCTOR", "ADMIN")),
):
    ensure_user_owner_or_admin(user_id, current_user)
    updated_count = mark_all_notifications_as_read(user_id)
    return BulkReadResponse(updatedCount=updated_count)
