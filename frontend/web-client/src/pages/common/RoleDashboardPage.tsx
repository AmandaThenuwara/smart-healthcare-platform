import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function RoleDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function getRoleMessage() {
    if (user?.role === "PATIENT") {
      return "Patient dashboard placeholder";
    }

    if (user?.role === "DOCTOR") {
      return "Doctor dashboard placeholder";
    }

    if (user?.role === "ADMIN") {
      return "Admin dashboard placeholder";
    }

    return "Role dashboard placeholder";
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
          <h2 style={sectionTitleStyle}>Role Area</h2>
          <p style={placeholderTextStyle}>{getRoleMessage()}</p>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f4f7fb",
  padding: "32px",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "900px",
  margin: "0 auto",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: "8px",
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#4b5563",
};

const infoCardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  marginBottom: "20px",
};

const placeholderCardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const sectionTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: "16px",
};

const infoTextStyle: React.CSSProperties = {
  margin: "8px 0",
  color: "#111827",
};

const placeholderTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#374151",
};

const logoutButtonStyle: React.CSSProperties = {
  padding: "10px 16px",
  border: "none",
  borderRadius: "10px",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontWeight: 600,
};