import type { CSSProperties, ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type DoctorShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function DoctorShell({
  title,
  subtitle,
  children,
}: DoctorShellProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div style={pageStyle}>
      <aside style={sidebarStyle}>
        <div>
          <h2 style={brandStyle}>Smart Healthcare</h2>
          <p style={roleStyle}>Doctor Portal</p>

          <nav style={navStyle}>
            <Link to="/doctor/dashboard" style={navLinkStyle}>
              Dashboard
            </Link>
            <Link to="/doctor/profile" style={navLinkStyle}>
              Profile
            </Link>
            <Link to="/doctor/availability" style={navLinkStyle}>
              Availability
            </Link>
            <Link to="/doctor/appointments" style={navLinkStyle}>
              Appointments
            </Link>
          </nav>
        </div>

        <div style={userBoxStyle}>
          <p style={userNameStyle}>{user?.fullName || "Doctor User"}</p>
          <p style={userMetaStyle}>{user?.email || "-"}</p>
          <button onClick={handleLogout} style={logoutButtonStyle}>
            Logout
          </button>
        </div>
      </aside>

      <main style={contentStyle}>
        <div style={headerCardStyle}>
          <h1 style={titleStyle}>{title}</h1>
          <p style={subtitleStyle}>{subtitle}</p>
        </div>

        {children}
      </main>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  background: "#f4f7fb",
};

const sidebarStyle: CSSProperties = {
  width: "260px",
  background: "#111827",
  color: "white",
  padding: "24px 18px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const brandStyle: CSSProperties = {
  margin: 0,
  marginBottom: "6px",
};

const roleStyle: CSSProperties = {
  margin: 0,
  color: "#cbd5e1",
  fontSize: "14px",
};

const navStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  marginTop: "28px",
};

const navLinkStyle: CSSProperties = {
  textDecoration: "none",
  color: "white",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "rgba(255,255,255,0.08)",
};

const userBoxStyle: CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.12)",
  paddingTop: "16px",
};

const userNameStyle: CSSProperties = {
  margin: 0,
  fontWeight: 700,
};

const userMetaStyle: CSSProperties = {
  marginTop: "6px",
  marginBottom: "16px",
  color: "#cbd5e1",
  fontSize: "13px",
};

const logoutButtonStyle: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#dc2626",
  color: "white",
  cursor: "pointer",
  fontWeight: 600,
};

const contentStyle: CSSProperties = {
  flex: 1,
  padding: "28px",
};

const headerCardStyle: CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  marginBottom: "20px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  marginBottom: "8px",
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "#4b5563",
};
