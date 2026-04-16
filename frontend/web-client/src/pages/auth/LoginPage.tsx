import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type ValidationDetail = {
  loc?: Array<string | number>;
  msg?: string;
};

type ApiErrorShape = {
  response?: {
    data?: {
      detail?: string | ValidationDetail[];
    };
  };
};

function getApiErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null) {
    const err = error as ApiErrorShape;
    const detail = err.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail) && detail.length > 0) {
      return detail
        .map((item) => {
          const field =
            item.loc && item.loc.length > 0
              ? String(item.loc[item.loc.length - 1])
              : "field";
          const message = item.msg || "Invalid value";
          return `${field}: ${message}`;
        })
        .join(", ");
    }
  }

  return "Login failed. Please check your credentials and try again.";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });

      navigate("/dashboard", { replace: true });
    } catch (error: unknown) {
      setError(getApiErrorMessage(error));
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Login</h1>
        <p style={subtitleStyle}>Sign in to Smart Healthcare Platform</p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
            required
            autoComplete="email"
            disabled={isLoading}
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
            required
            autoComplete="current-password"
            disabled={isLoading}
          />

          {error && (
            <p style={errorStyle} aria-live="polite">
              {error}
            </p>
          )}

          <button type="submit" style={buttonStyle} disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={footerTextStyle}>
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f4f7fb",
  padding: "24px",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  padding: "32px",
  borderRadius: "16px",
  background: "white",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const titleStyle: CSSProperties = {
  margin: 0,
  marginBottom: "8px",
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: "#4b5563",
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginTop: "20px",
};

const inputStyle: CSSProperties = {
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  outline: "none",
};

const buttonStyle: CSSProperties = {
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  background: "#1d4ed8",
  color: "white",
  cursor: "pointer",
  fontWeight: 600,
};

const errorStyle: CSSProperties = {
  color: "#dc2626",
  margin: 0,
  whiteSpace: "pre-wrap",
  fontSize: "14px",
};

const footerTextStyle: CSSProperties = {
  marginTop: "18px",
  color: "#374151",
};