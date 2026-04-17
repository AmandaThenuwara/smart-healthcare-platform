import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logoFull from "../../assets/img/LifePulse logo.png";
import sidebarImg from "../../assets/img/auth-sidebar.png";
import { Mail, Lock, LogIn, ShieldCheck, RefreshCw, HeartPulse, Shield } from "lucide-react";

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
    <div className="min-h-screen w-full flex bg-white overflow-hidden">
      {/* Left side: Form */}
      <div className="w-full lg:w-[50%] h-screen overflow-y-auto custom-scrollbar flex flex-col items-center justify-start py-20 px-8 md:px-16 animate-in fade-in slide-in-from-left-4 duration-700">
        <div className="w-full max-w-[440px]">
          <div className="flex flex-col mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
            <img src={logoFull} alt="LifePulse Logo" className="h-12 w-fit object-contain mb-8 group-hover:scale-105 transition-transform duration-500" />
            <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Welcome Back</h1>
            <p className="text-slate-400 text-[16px] font-medium leading-relaxed">Sign in to your LifePulse Healthcare account to manage your wellness journey.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col gap-2.5">
              <label className="text-[14px] font-bold text-slate-700 ml-1">Email Address</label>
              <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-100 px-5 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-100 focus-within:bg-white transition-all duration-300 shadow-sm shadow-slate-100/50">
                <Mail size={20} className="text-slate-400" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full py-4 bg-transparent outline-none text-[15px] font-semibold text-slate-800 placeholder:text-slate-300"
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-[14px] font-bold text-slate-700">Password</label>
                <Link to="/forgot-password" title="Forgot Password" className="text-[13px] font-bold text-[#0f172a] hover:opacity-70 transition-opacity">Forgot password?</Link>
              </div>
              <div className="flex items-center gap-3.5 bg-slate-50 border border-slate-100 px-5 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-100 focus-within:bg-white transition-all duration-300 shadow-sm shadow-slate-100/50">
                <Lock size={20} className="text-slate-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full py-4 bg-transparent outline-none text-[15px] font-semibold text-slate-800 placeholder:text-slate-300"
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-3.5 p-5 bg-rose-50 border border-rose-100 rounded-[18px] text-rose-600 text-[14px] font-bold animate-in fade-in slide-in-from-top-2 duration-300">
                <ShieldCheck size={20} className="flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              className="group relative flex items-center justify-center gap-3 bg-[#0f172a] text-white py-5 rounded-[20px] font-bold text-[16px] shadow-2xl shadow-slate-200 hover:bg-slate-800 hover:shadow-slate-300 transition-all active:scale-95 disabled:opacity-50 mt-2 overflow-hidden" 
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isLoading ? (
                <RefreshCw size={22} className="animate-spin opacity-50" />
              ) : (
                <>
                  <LogIn size={22} className="group-hover:translate-x-1 transition-transform" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-slate-400 text-[15px] font-medium">
              Don’t have an account? <Link to="/register" className="text-[#0f172a] font-black hover:underline underline-offset-4 ml-1">Create Account</Link>
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