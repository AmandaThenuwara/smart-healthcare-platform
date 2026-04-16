import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import PatientShell from "./PatientShell";
import {
  getMedicalReportsByPatient,
  getStoredPatientProfile,
} from "../../api/patientApi";
import { getNotificationsByUser } from "../../api/notificationApi";

export default function PatientDashboardPage() {
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [userId, setUserId] = useState("");
  const [reportCount, setReportCount] = useState<number>(0);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const storedPatient = getStoredPatientProfile();

      if (!storedPatient) {
        setIsLoading(false);
        return;
      }

      setPatientName(storedPatient.fullName);
      setPatientId(storedPatient.patientId);
      setUserId(storedPatient.userId);

      try {
        const [reports, notifications] = await Promise.all([
          getMedicalReportsByPatient(storedPatient.patientId),
          getNotificationsByUser(storedPatient.userId),
        ]);

        setReportCount(reports.length);
        setNotificationCount(notifications.length);
      } catch (error) {
        console.error("Failed to load patient dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboardData();
  }, []);

  return (
    <PatientShell
      title="Patient Dashboard"
      subtitle="Manage your patient profile, reports, and notifications."
    >
      {!patientId ? (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Profile Setup Required</h2>
          <p style={textStyle}>
            No patient profile is linked in the frontend yet. Create your patient
            profile first, then reports and notifications will use that saved record.
          </p>
          <Link to="/patient/profile" style={primaryLinkStyle}>
            Go to Patient Profile
          </Link>
        </div>
      ) : (
        <>
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Patient Name</p>
              <h3 style={statValueStyle}>{patientName}</h3>
            </div>

            <div style={statCardStyle}>
              <p style={statLabelStyle}>Patient ID</p>
              <h3 style={statValueStyle}>{patientId}</h3>
            </div>

            <div style={statCardStyle}>
              <p style={statLabelStyle}>User ID</p>
              <h3 style={statValueStyle}>{userId}</h3>
            </div>

            <div style={statCardStyle}>
              <p style={statLabelStyle}>Medical Reports</p>
              <h3 style={statValueStyle}>
                {isLoading ? "Loading..." : reportCount}
              </h3>
            </div>

            <div style={statCardStyle}>
              <p style={statLabelStyle}>Notifications</p>
              <h3 style={statValueStyle}>
                {isLoading ? "Loading..." : notificationCount}
              </h3>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Quick Actions</h2>
            <div style={actionRowStyle}>
              <Link to="/patient/profile" style={primaryLinkStyle}>
                Manage Profile
              </Link>
              <Link to="/patient/reports" style={secondaryLinkStyle}>
                Manage Reports
              </Link>
              <Link to="/patient/notifications" style={secondaryLinkStyle}>
                View Notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </PatientShell>
  );
}

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "20px",
};

const statCardStyle: CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const statLabelStyle: CSSProperties = {
  margin: 0,
  color: "#6b7280",
  fontSize: "14px",
};

const statValueStyle: CSSProperties = {
  marginTop: "10px",
  marginBottom: 0,
  wordBreak: "break-word",
};

const cardStyle: CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
};

const textStyle: CSSProperties = {
  color: "#374151",
  marginBottom: "16px",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const primaryLinkStyle: CSSProperties = {
  display: "inline-block",
  textDecoration: "none",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "#1d4ed8",
  color: "white",
  fontWeight: 600,
};

const secondaryLinkStyle: CSSProperties = {
  display: "inline-block",
  textDecoration: "none",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "#e5e7eb",
  color: "#111827",
  fontWeight: 600,
};
