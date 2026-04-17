import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Lock, 
  Shield, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { registerUser } from "../../api/authApi";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/auth";
import LifePulseLogo from "../../assets/img/LifePulse logo.png";
import LifePulseIcon from "../../assets/img/LifePulse icon.png";
import AuthBg from "../../assets/img/auth-bg.png";

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
      }, 1500);
    } catch (error: unknown) {
      setError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] font-sans antialiased text-black">
      {/* Visual Side */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden lg:order-2 bg-black">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={AuthBg} 
            alt="Healthcare background" 
            className="w-full h-full object-cover opacity-50 grayscale hover:scale-110 transition-transform duration-10000 ease-linear"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        </div>

         <div className="relative z-10 text-center space-y-8 max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl mx-auto rotate-6 hover:rotate-0 transition-all duration-500 p-4">
             <img src={LifePulseIcon} alt="LifePulse Icon" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-4">
             <div className="flex justify-center mb-6">
                <img src={LifePulseLogo} alt="LifePulse Logo" className="h-12 brightness-0 invert object-contain" />
             </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-4 leading-tight uppercase">Start Your Journey.</h1>
            <p className="text-gray-200 text-lg opacity-90 decoration-transparent">Join thousands of patients and healthcare providers in the most secure ecosystem.</p>
          </div>
          <div className="flex flex-col items-center gap-4 pt-4">
             <div className="px-6 py-2 bg-white/5 rounded-full border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                Certified Infrastructure
             </div>
             <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Enterprise-grade security included</p>
          </div>
        </div>
        
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[120px] translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* Form Side */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-white lg:bg-transparent lg:order-1">
        <div className="w-full max-w-sm space-y-12 animate-in fade-in slide-in-from-left-8 duration-700">
          {/* Logo (Visible on mobile) */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-10">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg p-2.5">
              <img src={LifePulseIcon} alt="Icon" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-black">LifePulse</h2>
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-bold tracking-tight text-black uppercase tracking-wide">Create account</h2>
            <p className="text-gray-500 text-base font-semibold opacity-70">Experience the next generation of healthcare.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-black transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-black/5 transition-all duration-200 outline-none placeholder:text-gray-300 font-semibold text-black"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                  autoComplete="name"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-black transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-black/5 transition-all duration-200 outline-none placeholder:text-gray-300 font-semibold text-black"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-black transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-black/5 transition-all duration-200 outline-none placeholder:text-gray-300 font-semibold text-black"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">I am a...</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-black transition-colors">
                  <Shield size={18} />
                </div>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:ring-4 focus:ring-black/5 transition-all duration-200 outline-none font-bold text-black appearance-none cursor-pointer"
                  disabled={isSubmitting}
                >
                  <option value="PATIENT">PATIENT</option>
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-gray-50 text-black rounded-2xl flex items-start gap-3 border border-gray-100 animate-in shake-in duration-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm font-bold leading-relaxed">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-4 bg-gray-50 text-gray-600 rounded-2xl flex items-start gap-3 border border-gray-100 animate-in zoom-in duration-300">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-black" />
                <p className="text-sm font-bold leading-relaxed">{message}</p>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full btn-primary py-4 flex items-center justify-center gap-3 shadow-xl shadow-black/10 group mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span className="font-bold uppercase tracking-widest text-xs">Register Account</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 font-bold text-sm">
            Already have an account? <Link to="/login" className="text-black font-bold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}