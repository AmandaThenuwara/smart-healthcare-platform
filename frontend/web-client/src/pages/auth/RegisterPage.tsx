import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/auth";
import logoFull from "../../assets/img/LifePulse logo.png";
import sidebarImg from "../../assets/img/auth-sidebar.png";
import { User, Mail, Lock, ShieldCheck, UserPlus, RefreshCw, HeartPulse, Shield } from "lucide-react";

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

      setMessage("Registration successful. Redirecting to login...");

      redirectTimerRef.current = window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (error: unknown) {
      setError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-white overflow-hidden">
      {/* Left side: Form */}
      <div className="w-full lg:w-[50%] h-screen overflow-y-auto custom-scrollbar flex flex-col items-center justify-start py-20 px-8 md:px-16 animate-in fade-in slide-in-from-left-4 duration-700">
        <div className="w-full max-w-[480px]">
          <div className="flex flex-col mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <img src={logoFull} alt="LifePulse Logo" className="h-12 w-fit object-contain mb-8 group-hover:scale-105 transition-transform duration-500" />
            <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Create Account</h1>
            <p className="text-slate-400 text-[16px] font-medium leading-relaxed">Join LifePulse to access AI-driven healthcare insights and consultations.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[13.5px] font-bold text-slate-700 ml-1">Full Name</label>
              <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-100 px-5 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-100 focus-within:bg-white transition-all duration-300 shadow-sm shadow-slate-100/50">
                <User size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full py-4 bg-transparent outline-none text-[15px] font-semibold text-slate-800"
                  required
                  autoComplete="name"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13.5px] font-bold text-slate-700 ml-1">Email Address</label>
              <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-100 px-5 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-100 focus-within:bg-white transition-all duration-300 shadow-sm shadow-slate-100/50">
                <Mail size={18} className="text-slate-400" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full py-4 bg-transparent outline-none text-[15px] font-semibold text-slate-800"
                  required
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13.5px] font-bold text-slate-700 ml-1">Secure Password</label>
              <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-100 px-5 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-100 focus-within:bg-white transition-all duration-300 shadow-sm shadow-slate-100/50">
                <Lock size={18} className="text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full py-4 bg-transparent outline-none text-[15px] font-semibold text-slate-800"
                  required
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13.5px] font-bold text-slate-700 ml-1">Your Role</label>
              <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-100 px-5 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-100 focus-within:bg-white transition-all duration-300 shadow-sm shadow-slate-100/50">
                <ShieldCheck size={18} className="text-slate-400" />
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as UserRole })
                  }
                  className="w-full py-4 bg-transparent outline-none text-[15px] font-bold text-slate-800 appearance-none cursor-pointer"
                  disabled={isSubmitting}
                >
                  <option value="PATIENT">PATIENT</option>
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3.5 p-5 bg-rose-50 border border-rose-100 rounded-[18px] text-rose-600 text-[14px] font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                <ShieldCheck size={18} className="mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {message && (
              <div className="flex items-start gap-3.5 p-5 bg-emerald-50 border border-emerald-100 rounded-[18px] text-emerald-600 text-[14px] font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                <ShieldCheck size={18} className="mt-0.5 flex-shrink-0" />
                <p>{message}</p>
              </div>
            )}

            <button 
              type="submit" 
              className="group relative flex items-center justify-center gap-3 bg-[#0f172a] text-white py-5 rounded-[20px] font-bold text-[16px] shadow-2xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 mt-2 overflow-hidden" 
              disabled={isSubmitting}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isSubmitting ? (
                <RefreshCw size={22} className="animate-spin opacity-50" />
              ) : (
                <>
                  <UserPlus size={22} className="group-hover:translate-x-1 transition-transform" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-slate-400 text-[15px] font-medium">
              Already have an account? <Link to="/login" className="text-[#0f172a] font-black hover:underline underline-offset-4 ml-1">Sign In</Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Image Panel */}
      <div className="hidden lg:flex lg:w-[50%] relative animate-in fade-in duration-1000">
        <img 
          src={sidebarImg} 
          alt="Healthcare Excellence" 
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}