import type { CSSProperties } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={loadingPageStyle}>
        <div style={loadingCardStyle}>
          <h2 style={{ margin: 0 }}>Checking session...</h2>
          <p style={{ marginTop: "8px", color: "#4b5563" }}>
            Please wait while we verify your login.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

const loadingPageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f4f7fb",
  padding: "24px",
};

const loadingCardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  padding: "28px",
  borderRadius: "16px",
  background: "white",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  textAlign: "center",
};
