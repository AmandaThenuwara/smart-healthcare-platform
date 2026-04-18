import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight,
  Stethoscope,
  LayoutDashboard
} from "lucide-react";
import DoctorShell from "./DoctorShell";
import {
  getAvailabilitySlots,
  getStoredDoctorProfile,
} from "../../api/doctorApi";
import { getAppointmentsByDoctor } from "../../api/appointmentApi";
import LifePulseIcon from "../../assets/img/LifePulse icon.png";

const StatCard = ({ label, value, icon: Icon }: any) => (
  <div className="card-premium flex flex-col justify-between group hover:shadow-xl transition-all duration-300">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 group-hover:bg-black group-hover:text-white transition-all duration-300 shadow-sm">
        <Icon size={24} />
      </div>
      <div className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={20} />
      </div>
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-lg font-bold tracking-tight text-black break-words line-clamp-1">{value}</h3>
    </div>
  </div>
);

export default function DoctorDashboardPage() {
  const [doctorName, setDoctorName] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [availabilityCount, setAvailabilityCount] = useState<number>(0);
  const [appointmentCount, setAppointmentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const storedDoctor = getStoredDoctorProfile();

      if (!storedDoctor) {
        setIsLoading(false);
        return;
      }

      setDoctorName(storedDoctor.fullName);
      setDoctorId(storedDoctor.doctorId);

      try {
        const [slots, appointments] = await Promise.all([
          getAvailabilitySlots(storedDoctor.doctorId),
          getAppointmentsByDoctor(storedDoctor.doctorId),
        ]);

        setAvailabilityCount(slots.length);
        setAppointmentCount(appointments.length);
      } catch (error) {
        console.error("Failed to load doctor dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboardData();
  }, []);

  return (
    <DoctorShell
      title="Dashboard"
      subtitle="Manage your profile, maintain your availability, and handle appointment requests."
    >
      {!doctorId ? (
        <div className="card-premium text-center py-16 space-y-6 animate-in zoom-in duration-500 border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-black">
            <User size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Profile Setup Required</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              You haven't completed your doctor profile yet. Please set up your professional profile to start accepting appointments.
            </p>
          </div>
          <div className="pt-4">
            <Link to="/doctor/profile" className="btn-primary inline-flex items-center gap-2 group">
              Complete Profile
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Doctor Name" value={doctorName} icon={User} />
            <StatCard label="Doctor ID" value={doctorId} icon={ShieldCheck} />
            <StatCard label="Availability Slots" value={isLoading ? "..." : availabilityCount} icon={Clock} />
            <StatCard label="Appointments" value={isLoading ? "..." : appointmentCount} icon={Calendar} />
          </div>

          {/* Quick Actions */}
          <div className="card-premium border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold uppercase tracking-tight">Professional Actions</h2>
              <div className="p-2 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                <img src={LifePulseIcon} alt="Icon" className="w-5 h-5 object-contain" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/doctor/profile" className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-black group transition-all duration-300 border border-transparent shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                       <User size={20} />
                    </div>
                    <span className="font-bold text-sm text-gray-800 group-hover:text-white transition-colors">Manage Profile</span>
                 </div>
                 <ArrowRight size={18} className="text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>

              <Link to="/doctor/availability" className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-black group transition-all duration-300 border border-transparent shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                       <Clock size={20} />
                    </div>
                    <span className="font-bold text-sm text-gray-800 group-hover:text-white transition-colors">Maintain Schedule</span>
                 </div>
                 <ArrowRight size={18} className="text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>

              <Link to="/doctor/appointments" className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-black group transition-all duration-300 border border-transparent shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                       <Calendar size={20} />
                    </div>
                    <span className="font-bold text-sm text-gray-800 group-hover:text-white transition-colors">Appointment Queue</span>
                 </div>
                 <ArrowRight size={18} className="text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <div className="card-premium border border-gray-100 flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                   <Stethoscope size={32} />
                </div>
                <h3 className="font-bold uppercase tracking-tight">Telemedicine Session</h3>
                <p className="text-xs text-gray-500 max-w-xs">Start a secure video consultation with your scheduled patients.</p>
                <Link to="/doctor/telemedicine" className="btn-primary py-3 px-8 text-xs font-bold uppercase tracking-widest">Open Clinic</Link>
             </div>

             <div className="card-premium border border-gray-100 flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                   <LayoutDashboard size={32} />
                </div>
                <h3 className="font-bold uppercase tracking-tight">System Reports</h3>
                <p className="text-xs text-gray-500 max-w-xs">View performance statistics and patient engagement metrics.</p>
                <button className="btn-primary py-3 px-8 text-xs font-bold uppercase tracking-widest opacity-50 cursor-not-allowed">Coming Soon</button>
             </div>
          </div>
        </div>
      )}
    </DoctorShell>
  );
}
