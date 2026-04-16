import { Navigate, useNavigate } from "react-router-dom";
import type { CSSProperties } from "react";
import { useAuth } from "../../context/AuthContext";

export default function RoleDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  if (user?.role === "DOCTOR") {
    return <Navigate to="/doctor/dashboard" replace />;
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <div style={headerRowStyle}>
          <div>
            <h1 style={titleStyle}>Dashboard</h1>
            <p style={subtitleStyle}>Welcome back to Smart Healthcare Platform</p>
          </div>

          <button onClick={handleLogout} style={logoutButtonStyle}>
            Logout
          </button>
        </div>

        <div style={infoCardStyle}>
          <h2 style={sectionTitleStyle}>User Information</h2>
          <p style={infoTextStyle}>
            <strong>Full Name:</strong> {user?.fullName || "-"}
          </p>
          <p style={infoTextStyle}>
            <strong>Email:</strong> {user?.email || "-"}
          </p>
          <p style={infoTextStyle}>
            <strong>Role:</strong> {user?.role || "-"}
          </p>
        </div>

        <div style={placeholderCardStyle}>
          <h2 style={sectionTitleStyle}>Current Frontend Status</h2>
          {user?.role === "PATIENT" && (
            <p style={placeholderTextStyle}>Patient dashboard placeholder</p>
          )}
          {user?.role === "ADMIN" && (
            <p style={placeholderTextStyle}>Admin dashboard placeholder</p>
          )}
          {!user?.role && (
            <p style={placeholderTextStyle}>Role dashboard placeholder</p>
          )}
        </div>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#f4f7fb",
  padding: "32px",
};

const containerStyle: CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const titleStyle: CSSProperties = {
  margin: 0,
  marginBottom: "8px",
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "#4b5563",
};

const infoCardStyle: CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  marginBottom: "20px",
};

const placeholderCardStyle: CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "16px",
};

const infoTextStyle: CSSProperties = {
  margin: "8px 0",
  color: "#111827",
};

const placeholderTextStyle: CSSProperties = {
  margin: 0,
  color: "#374151",
};

const logoutButtonStyle: CSSProperties = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "10px",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontWeight: 600,
};
