import { createAuthorizedApi } from "./apiClient";
import type { CreateNotificationPayload, UserNotification } from "../types/notification";

const _rawNotificationUrl = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || "http://127.0.0.1:8007";
const NOTIFICATION_SERVICE_URL = (_rawNotificationUrl.startsWith("http") ? _rawNotificationUrl : `https://${_rawNotificationUrl}`).replace(/\/$/, "");

const NOTIFICATION_BASE_URL = `${NOTIFICATION_SERVICE_URL}/api/v1`;

const notificationApi = createAuthorizedApi(NOTIFICATION_BASE_URL);

export async function createNotification(
  payload: CreateNotificationPayload
): Promise<UserNotification> {
  const response = await notificationApi.post("/notifications", payload);
  return response.data;
}

export async function getNotificationsByUser(
  userId: string
): Promise<UserNotification[]> {
  const response = await notificationApi.get(`/notifications/user/${userId}`);
  return response.data;
}
