import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getStoredPatientProfile } from "../../api/patientApi";
import {
  createNotification,
  getNotificationsByUser,
} from "../../api/notificationApi";
import type { NotificationType, UserNotification } from "../../types/notification";
import PatientShell from "./PatientShell";

const NOTIFICATION_TYPES: NotificationType[] = [
  "APPOINTMENT",
  "PAYMENT",
  "CONSULTATION",
  "GENERAL",
];

function extractUserId(user: unknown): string {
  if (user && typeof user === "object") {
    const candidate = user as {
      userId?: string;
      id?: string;
      _id?: string;
    };

    return candidate.userId || candidate.id || candidate._id || "";
  }

  return "";
}

function sortNotifications(notifications: UserNotification[]) {
  return [...notifications].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function PatientNotificationsPage() {
  const { user } = useAuth();
  const authUserId = useMemo(() => extractUserId(user), [user]);

  const [userId, setUserId] = useState("");
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "GENERAL" as NotificationType,
  });

  useEffect(() => {
    const storedPatient = getStoredPatientProfile();
    const resolvedUserId = storedPatient?.userId || authUserId;

    if (!resolvedUserId) {
      setIsLoading(false);
      return;
    }

    setUserId(resolvedUserId);
    void loadNotifications(resolvedUserId);
  }, [authUserId]);

  async function loadNotifications(currentUserId: string) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getNotificationsByUser(currentUserId);
      setNotifications(sortNotifications(data));
    } catch (error) {
      console.error(error);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!userId) {
      setError("Create the patient profile first or make sure a valid userId is available.");
      return;
    }

    try {
      await createNotification({
        userId,
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
      });

      setMessage("Notification created successfully.");
      setForm({
        title: "",
        message: "",
        type: "GENERAL",
      });

      await loadNotifications(userId);
    } catch (error) {
      console.error(error);
      setError("Failed to create notification");
    }
  }

  return (
    <PatientShell
      title="Notifications"
      subtitle="Create test notifications and view notifications for the current patient user."
    >
      {!userId ? (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Patient Profile Needed</h2>
          <p style={textStyle}>
            Please create the patient profile first so the frontend has a saved
            userId to use.
          </p>
          <Link to="/patient/profile" style={linkButtonStyle}>
            Go to Patient Profile
          </Link>
        </div>
      ) : (
        <>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Create Notification</h2>

            <form onSubmit={handleSubmit} style={formGridStyle}>
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={inputStyle}
                  placeholder="Appointment Created"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Type</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as NotificationType })
                  }
                  style={inputStyle}
                >
                  {NOTIFICATION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  style={textareaStyle}
                  placeholder="Your appointment request was submitted successfully."
                  required
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                {error && <p style={errorStyle}>{error}</p>}
                {message && <p style={successStyle}>{message}</p>}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <button type="submit" style={buttonStyle}>
                  Create Notification
                </button>
              </div>
            </form>
          </div>

          <div style={{ ...cardStyle, marginTop: "20px" }}>
            <div style={headerRowStyle}>
              <h2 style={sectionTitleStyle}>Notification List</h2>
              <button onClick={() => void loadNotifications(userId)} style={secondaryButtonStyle}>
                Refresh
              </button>
            </div>

            {isLoading ? (
              <p style={textStyle}>Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p style={textStyle}>No notifications found yet.</p>
            ) : (
              <div style={notificationListStyle}>
                {notifications.map((notification) => (
                  <div key={notification.notificationId} style={notificationCardStyle}>
                    <div style={notificationHeaderStyle}>
                      <h3 style={notificationTitleStyle}>{notification.title}</h3>
                      <span style={typeBadgeStyle}>{notification.type}</span>
                    </div>
                    <p style={messageTextStyle}>{notification.message}</p>
                    <p style={metaTextStyle}>
                      <strong>Read:</strong> {notification.isRead ? "Yes" : "No"}
                    </p>
                    <p style={metaTextStyle}>
                      <strong>Created At:</strong>{" "}
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PatientShell>
  );
}

const cardStyle: CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "14px",
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "#374151",
};

const linkButtonStyle: CSSProperties = {
  display: "inline-block",
  marginTop: "16px",
  textDecoration: "none",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "#1d4ed8",
  color: "white",
  fontWeight: 600,
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "110px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
  resize: "vertical",
};

const buttonStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#1d4ed8",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#e5e7eb",
  color: "#111827",
  fontWeight: 600,
  cursor: "pointer",
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: "#dc2626",
};

const successStyle: CSSProperties = {
  margin: 0,
  color: "#16a34a",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "14px",
  flexWrap: "wrap",
};

const notificationListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const notificationCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
  background: "#fcfcfd",
};

const notificationHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap",
};

const notificationTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
};

const typeBadgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1e3a8a",
  fontWeight: 700,
  fontSize: "12px",
};

const messageTextStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "10px",
  color: "#374151",
};

const metaTextStyle: CSSProperties = {
  margin: "6px 0",
  color: "#374151",
};
