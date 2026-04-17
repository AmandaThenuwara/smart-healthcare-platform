import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] font-sans antialiased text-black">
      {/* Visual Side (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden bg-black">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img 
            src={AuthBg} 
            alt="Healthcare background" 
            className="w-full h-full object-cover opacity-50 grayscale hover:scale-110 transition-transform duration-10000 ease-linear"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        </div>

        <div className="relative z-10 text-center space-y-8 max-w-md animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl mx-auto rotate-6 hover:rotate-0 transition-all duration-500 p-4">
            <img src={LifePulseIcon} alt="LifePulse Icon" className="w-full h-full object-contain" />
          </div>
          <div className="space-y-4">
             <div className="flex justify-center mb-6">
                <img src={LifePulseLogo} alt="LifePulse Logo" className="h-12 brightness-0 invert object-contain" />
             </div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-4 leading-tight uppercase">Performance Healthcare.</h1>
            <p className="text-gray-200 text-lg opacity-90 decoration-transparent">Access your patient profile, monitor your reports, and consult with professionals—all in one premium platform.</p>
          </div>
          <div className="flex items-center justify-center gap-6 pt-4">
             <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-white text-[10px] font-bold flex items-center justify-center text-black shadow-lg uppercase">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
             </div>
             <p className="text-gray-300 text-sm font-semibold uppercase tracking-widest text-[10px]">Joined by 10k+ patients</p>
          </div>
        </div>
        
        {/* Abstract background shapes - Grayscale */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>
      </div>

      {/* Login Side */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-24 bg-white lg:bg-transparent">
        <div className="w-full max-w-sm space-y-12 animate-in fade-in slide-in-from-right-8 duration-700">
          {/* Logo (Visible on mobile) */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-10">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg p-2.5">
              <img src={LifePulseIcon} alt="Icon" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-black">LifePulse</h2>
          </div>

          <div className="space-y-3">
            <h2 className="text-4xl font-bold tracking-tight text-black uppercase tracking-wide">Sign in</h2>
            <p className="text-gray-500 text-base font-semibold opacity-70">Welcome back! Please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                <a href="#" className="text-[10px] font-bold text-black hover:underline uppercase tracking-wider">Forgot?</a>
              </div>
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
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-gray-50 text-black rounded-2xl flex items-start gap-3 border border-gray-100 animate-in shake-in duration-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="text-sm font-bold leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              className="w-full btn-primary py-4 flex items-center justify-center gap-3 shadow-xl shadow-black/10 group mt-4"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <span className="font-bold uppercase tracking-widest text-xs">Log in</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 font-semibold text-sm">
            Don’t have an account? <Link to="/register" className="text-black font-bold hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}