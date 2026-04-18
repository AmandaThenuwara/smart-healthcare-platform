import type { ReactNode } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  User, 
  Calendar, 
  Clock, 
  Stethoscope, 
  LogOut,
  Bell,
  Search,
  Settings
} from "lucide-react";
import { clearStoredDoctorProfile } from "../../api/doctorApi";
import { clearStoredPatientProfile } from "../../api/patientApi";
import { useAuth } from "../../context/AuthContext";
import LifePulseIcon from "../../assets/img/LifePulse icon.png";

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
  const location = useLocation();
  const { user, logout } = useAuth();

  function handleLogout() {
    clearStoredPatientProfile();
    clearStoredDoctorProfile();
    logout();
    navigate("/login", { replace: true });
  }

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/doctor/dashboard" },
    { label: "Profile", icon: User, path: "/doctor/profile" },
    { label: "Availability", icon: Clock, path: "/doctor/availability" },
    { label: "Appointments", icon: Calendar, path: "/doctor/appointments" },
    { label: "Telemedicine", icon: Stethoscope, path: "/doctor/telemedicine" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans antialiased text-black">
      {/* Sidebar - Floating Navy Style */}
      <aside className="fixed left-6 top-6 bottom-6 w-[280px] bg-sidebar text-white flex flex-col justify-between p-8 rounded-[2.5rem] shadow-2xl z-50 transition-all duration-300">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 px-1 mt-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg overflow-hidden p-1.5">
              <img src={LifePulseIcon} alt="Icon" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white leading-tight">LifePulse</h2>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-item font-bold">Doctor Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={isActive 
                    ? "flex items-center gap-3 px-5 py-4 rounded-2xl bg-white text-sidebar font-bold shadow-lg transition-all" 
                    : "flex items-center gap-3 px-5 py-4 rounded-2xl text-sidebar-item hover:text-white hover:bg-white/5 transition-all"}
                >
                  <item.icon size={20} />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout */}
        <div className="space-y-4 mb-2">
          <div className="p-4 bg-white/5 rounded-[1.5rem] border border-white/5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-white uppercase text-lg border border-white/10 shadow-inner shrink-0">
               {user?.fullName?.charAt(0) || "D"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.fullName || "Doctor"}</p>
              <p className="text-[10px] text-sidebar-item truncate font-medium uppercase tracking-tight">{user?.email}</p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-white/5 rounded-[1.5rem] text-sidebar-item hover:bg-white hover:text-sidebar transition-all duration-300 group border border-white/5 shadow-sm"
          >
            <LogOut size={18} className="rotate-180" />
            <span className="font-bold text-[10px] uppercase tracking-[0.15em]">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content - Adjusted for floating sidebar */}
      <main className="flex-1 ml-[326px] flex flex-col p-10 mr-4">
        {/* Header bar */}
        <header className="flex items-center justify-between mb-10">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-5 text-gray-400">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Search patients, records..." 
              className="w-full pl-14 pr-5 py-4 bg-white rounded-[1.5rem] border-none shadow-premium outline-none focus:ring-8 focus:ring-black/[0.02] transition-all text-sm font-medium"
            />
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:block text-right mr-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
             </div>
             <button className="p-4 bg-white rounded-2xl shadow-premium text-gray-400 hover:text-black transition-all relative border border-gray-50">
                <Bell size={20} />
                <span className="absolute top-4 right-4 w-2 h-2 bg-black rounded-full border-2 border-white"></span>
             </button>
             <button className="p-4 bg-white rounded-2xl shadow-premium text-gray-400 hover:text-black transition-all border border-gray-50">
                <Settings size={20} />
             </button>
          </div>
        </header>

        {/* Page Titles Header */}
        <div className="mb-10 p-10 bg-white rounded-[3rem] shadow-premium relative overflow-hidden border border-gray-100">
           <div className="relative z-10">
              <h1 className="text-3xl font-bold tracking-tight mb-2 text-black uppercase tracking-wider">{title}</h1>
              <p className="text-gray-500 text-sm font-medium max-w-2xl leading-relaxed">{subtitle}</p>
           </div>
           {/* Abstract Decoration */}
           <div className="absolute -right-20 -top-20 w-80 h-80 bg-gray-100 rounded-full blur-[100px]"></div>
        </div>

        {/* Content area */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}