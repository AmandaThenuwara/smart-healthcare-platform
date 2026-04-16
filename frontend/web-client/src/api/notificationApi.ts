import axios from "axios";
import type {
  CreateNotificationPayload,
  UserNotification,
} from "../types/notification";

const NOTIFICATION_SERVICE_URL = (
  import.meta.env.VITE_NOTIFICATION_SERVICE_URL || "http://127.0.0.1:8007"
).replace(/\/$/, "");

const NOTIFICATION_BASE_URL = `${NOTIFICATION_SERVICE_URL}/api/v1`;

const notificationApi = axios.create({
  baseURL: NOTIFICATION_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
