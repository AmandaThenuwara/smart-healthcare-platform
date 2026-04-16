import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/auth";

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

  return "Registration failed";
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const redirectTimerRef = useRef<number | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "PATIENT" as UserRole,
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      await registerUser({
        ...form,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
      });

      setMessage("Registration successful. Please login.");

      redirectTimerRef.current = window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1000);
    } catch (error: unknown) {
      setError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Register</h1>
        <p style={subtitleStyle}>Create a new Smart Healthcare account</p>

        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            type="text"
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            style={inputStyle}
            required
            autoComplete="name"
            disabled={isSubmitting}
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
            required
            autoComplete="email"
            disabled={isSubmitting}
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
            required
            autoComplete="new-password"
            disabled={isSubmitting}
          />

          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as UserRole })
            }
            style={inputStyle}
            disabled={isSubmitting}
          >
            <option value="PATIENT">PATIENT</option>
            <option value="DOCTOR">DOCTOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>

          {error && (
            <p style={errorStyle} aria-live="polite">
              {error}
            </p>
          )}

          {message && (
            <p style={successStyle} aria-live="polite">
              {message}
            </p>
          )}

          <button type="submit" style={buttonStyle} disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>

        <p style={footerTextStyle}>
          Already have an account? <Link to="/login">Login</Link>
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
  whiteSpace: "pre-wrap",
  margin: 0,
  fontSize: "14px",
};

const successStyle: CSSProperties = {
  color: "#16a34a",
  margin: 0,
  fontSize: "14px",
};

const footerTextStyle: CSSProperties = {
  marginTop: "18px",
  color: "#374151",
};