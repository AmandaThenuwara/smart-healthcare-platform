import type { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  Bell, 
  CreditCard, 
  Video, 
  Stethoscope, 
  LogOut,
  Search,
  Settings,
} from "lucide-react";
import logoIcon from "../../assets/img/LifePulse icon.png";
import logoFull from "../../assets/img/LifePulse logo.png";

type PatientShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function PatientShell({
  title,
  subtitle,
  children,
}: PatientShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }


const navItems = [
    { path: "/patient/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/patient/profile", label: "Profile", icon: User },
    { path: "/patient/reports", label: "Reports", icon: FileText },
    { path: "/patient/notifications", label: "Notifications", icon: Bell },
    { path: "/patient/payments", label: "Payments", icon: CreditCard },
    { path: "/patient/telemedicine", label: "Telemedicine", icon: Video },
    { path: "/patient/symptom-checker", label: "Symptom Checker", icon: Stethoscope },
  ];

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="flex w-full min-h-screen bg-bg-main">
      {/* Sidebar */}
      <aside className="w-[280px] bg-[#0f172a] ml-4 my-4 rounded-[32px] flex flex-col p-7 fixed h-[calc(100vh-32px)] left-0 top-0 z-[100] shadow-2xl">
        <div className="flex items-center gap-3.5 mb-10 px-2">
          <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center p-2 shadow-lg overflow-hidden">
            <img src={logoIcon} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-white text-[16px] font-bold leading-tight tracking-tight">LifePulse</h2>
            <p className="text-slate-400 text-[10px] font-bold m-0 opacity-60 uppercase tracking-[0.2em]">Patient Portal</p>
          </div>
        </div>

        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3.5 pl-8 pr-4 py-3 rounded-[16px] text-[13.5px] font-semibold transition-all duration-300 group ${
                  isActive 
                    ? "bg-white text-[#0f172a] shadow-xl translate-x-1" 
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={19} className={isActive ? "text-[#0f172a]" : "text-slate-500 group-hover:text-white transition-colors"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 pt-6 border-t border-white/5">
          <div className="flex items-center gap-3 p-3.5 bg-white/5 rounded-[20px] border border-white/5 shadow-inner group cursor-pointer hover:bg-white/[0.08] transition-colors">
            <div className="w-10 h-10 rounded-full bg-[#1e293b] text-white flex items-center justify-center text-[12px] font-bold border border-white/10 shadow-lg group-hover:scale-105 transition-transform">
              {user?.fullName?.split(' ').map(n => n[0]).join('') || "P"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-bold m-0 overflow-hidden text-ellipsis whitespace-nowrap">
                {user?.fullName || "Patient User"}
              </p>
              <p className="text-slate-500 text-[10.5px] font-medium m-0 overflow-hidden text-ellipsis whitespace-nowrap opacity-70">
                {user?.email || "-"}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center gap-2.5 p-3.5 bg-white/5 border border-white/5 text-slate-400 rounded-[16px] text-[13.5px] font-bold w-full hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all duration-300"
          >
            <LogOut size={18} className="text-red-400/70" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="ml-[300px] flex-1 flex flex-col min-w-0">
        <header className="h-[88px] flex items-center justify-between px-12 bg-transparent">
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-xl w-full max-w-[600px] shadow-soft">
            <Search size={18} className="text-secondary" />
            <input type="text" placeholder="Search..." className="border-none outline-none w-full bg-transparent text-primary" />
          </div>
          <div className="flex items-center gap-6">
            <span className="text-secondary text-sm font-medium">{currentDate}</span>
            <button className="relative w-11 h-11 flex items-center justify-center bg-white border-none rounded-md shadow-soft hover:shadow-md transition-shadow">
              <Bell size={20} className="text-secondary" />
              <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
            </button>
            <button className="w-11 h-11 flex items-center justify-center bg-white border-none rounded-md shadow-soft hover:shadow-md transition-shadow">
              <Settings size={20} className="text-secondary" />
            </button>
          </div>
        </header>

        <main className="px-12 pb-12">
          <div className="bg-white p-8 rounded-xl mb-8 shadow-soft flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1 ml-0 leading-tight">{title}</h1>
              <p className="text-secondary text-sm m-0">{subtitle}</p>
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}


