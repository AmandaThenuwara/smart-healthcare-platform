export type NotificationType =
  | "APPOINTMENT"
  | "PAYMENT"
  | "CONSULTATION"
  | "GENERAL";

export interface UserNotification {
  notificationId: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
}
