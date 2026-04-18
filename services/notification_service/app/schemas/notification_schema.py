from typing import Literal

from pydantic import BaseModel, Field


NotificationType = Literal["APPOINTMENT", "PAYMENT", "CONSULTATION", "GENERAL"]


class NotificationCreate(BaseModel):
    userId: str
    title: str = Field(..., min_length=2, max_length=150)
    message: str = Field(..., min_length=2, max_length=500)
    type: NotificationType


class NotificationReadUpdate(BaseModel):
    isRead: bool = True


class NotificationResponse(BaseModel):
    notificationId: str
    userId: str
    title: str
    message: str
    type: str
    isRead: bool
    createdAt: str


class BulkReadResponse(BaseModel):
    updatedCount: int
