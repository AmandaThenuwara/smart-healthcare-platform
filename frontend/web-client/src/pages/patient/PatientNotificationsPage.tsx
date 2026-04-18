import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getStoredPatientProfile } from "../../api/patientApi";
import {
  getNotificationsByUser,
} from "../../api/notificationApi";
import type { UserNotification } from "../../types/notification";
import PatientShell from "./PatientShell";



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
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PatientShell
      title="Notification Center"
      subtitle="Track your appointments, payments, and system alerts in one place."
    >
      <style>{`
        .notification-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border-left: 4px solid transparent !important;
          cursor: default;
        }
        .notification-card:hover {
          transform: translateX(8px);
          background-color: #ffffff !important;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06) !important;
          border-left: 4px solid #111827 !important;
          border-color: #e5e7eb !important;
        }
        .refresh-btn {
          transition: all 0.2s ease;
        }
        .refresh-btn:hover {
          background-color: #111827 !important;
          color: white !important;
          transform: rotate(15deg);
        }
      `}</style>

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
          {/* Create Notification form removed temporarily as requested */}
          
          <div style={{ ...cardStyle }}>
            <div style={headerRowStyle}>
              <h2 style={{ ...sectionTitleStyle, color: "#111827", fontWeight: 800 }}>Notification History</h2>
              <button 
                onClick={() => void loadNotifications(userId)} 
                className="refresh-btn"
                style={secondaryButtonStyle}
              >
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <p style={textStyle}>Loading your secure notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", background: "#f9fafb", borderRadius: "12px" }}>
                <p style={{ ...textStyle, color: "#9ca3af" }}>Your notification tray is empty.</p>
              </div>
            ) : (
              <div style={notificationListStyle}>
                {notifications.map((notification) => (
                  <div 
                    key={notification.notificationId} 
                    className="notification-card"
                    style={notificationCardStyle}
                  >
                    <div style={notificationHeaderStyle}>
                      <h3 style={notificationTitleStyle}>{notification.title}</h3>
                      <span style={typeBadgeStyle}>{notification.type}</span>
                    </div>
                    <p style={messageTextStyle}>{notification.message}</p>
                    
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f3f4f6" }}>
                      <p style={metaTextStyle}>
                        <span style={{ color: "#9ca3af", fontSize: "11px", fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                          {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </p>
                      {!notification.isRead && (
                        <span style={{ height: "8px", width: "8px", background: "#111827", borderRadius: "50%" }}></span>
                      )}
                    </div>
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
  background: "#ffffff",
  borderRadius: "16px",
  padding: "32px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "14px",
  fontSize: "24px",
  letterSpacing: "-0.5px",
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "#4b5563",
  lineHeight: 1.6,
};

const linkButtonStyle: CSSProperties = {
  display: "inline-block",
  marginTop: "16px",
  textDecoration: "none",
  padding: "12px 24px",
  borderRadius: "12px",
  background: "#111827",
  color: "white",
  fontWeight: 600,
};

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 20px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  background: "white",
  color: "#111827",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "32px",
  flexWrap: "wrap",
};

const notificationListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const notificationCardStyle: CSSProperties = {
  border: "1px solid #f3f4f6",
  borderRadius: "16px",
  padding: "20px",
  background: "#f9fafb",
};

const notificationHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  marginBottom: "8px",
};

const notificationTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 700,
  color: "#111827",
};

const typeBadgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "4px 10px",
  borderRadius: "6px",
  background: "#f3f4f6",
  color: "#374151",
  fontWeight: 700,
  fontSize: "10px",
  letterSpacing: "0.5px",
};

const messageTextStyle: CSSProperties = {
  margin: 0,
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: 1.5,
};

const metaTextStyle: CSSProperties = {
  margin: 0,
};
