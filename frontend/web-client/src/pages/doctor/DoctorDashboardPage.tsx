import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DoctorShell from "./DoctorShell";
import {
  getAvailabilitySlots,
  getStoredDoctorProfile,
} from "../../api/doctorApi";
import { getAppointmentsByDoctor } from "../../api/appointmentApi";
import { 
  User, 
  Activity, 
  Calendar, 
  ClipboardList, 
  AlertCircle,
  Video,
  Settings,
  ArrowRight
} from "lucide-react";

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
      title="Doctor Dashboard"
      subtitle="Manage your profile, availability, and appointment workflow."
    >
      {!doctorId ? (
        <div className="bg-white rounded-[24px] p-12 shadow-soft flex flex-col items-center text-center gap-6 border border-slate-100/50">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
            <AlertCircle size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2 text-slate-800">Profile Setup Required</h2>
            <p className="text-slate-500 max-w-md font-medium leading-relaxed">
              No doctor profile is linked in the frontend yet. Create your doctor
              profile first to manage your availability.
            </p>
          </div>
          <Link to="/doctor/profile" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg hover:bg-slate-800 transition-all">
            Go to Doctor Profile
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-7 rounded-[28px] shadow-soft border border-slate-100/50 group hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6 group-hover:bg-[#0f172a] group-hover:text-white transition-colors duration-300 shadow-inner">
                <User size={22} />
              </div>
              <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.15em] mb-1">Doctor Name</p>
              <h3 className="text-[17px] font-bold text-slate-800 truncate">{doctorName}</h3>
            </div>

            <div className="bg-white p-7 rounded-[28px] shadow-soft border border-slate-100/50 group hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6 group-hover:bg-[#0f172a] group-hover:text-white transition-colors duration-300 shadow-inner">
                <Activity size={22} />
              </div>
              <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.15em] mb-1">Doctor ID</p>
              <h3 className="text-[15px] font-bold text-slate-800 truncate tracking-tight">{doctorId}</h3>
            </div>

            <div className="bg-white p-7 rounded-[28px] shadow-soft border border-slate-100/50 group hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6 group-hover:bg-[#0f172a] group-hover:text-white transition-colors duration-300 shadow-inner">
                <Calendar size={22} />
              </div>
              <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.15em] mb-1">Availability Slots</p>
              <h3 className="text-[24px] font-bold text-slate-800">{isLoading ? "---" : availabilityCount}</h3>
            </div>

            <div className="bg-white p-7 rounded-[28px] shadow-soft border border-slate-100/50 group hover:shadow-xl hover:translate-y-[-4px] transition-all duration-300">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6 group-hover:bg-[#0f172a] group-hover:text-white transition-colors duration-300 shadow-inner">
                <ClipboardList size={22} />
              </div>
              <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.15em] mb-1">Total Appointments</p>
              <h3 className="text-[24px] font-bold text-slate-800">{isLoading ? "---" : appointmentCount}</h3>
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-10 shadow-soft border border-slate-100/50">
            <h2 className="text-[19px] font-bold text-slate-800 mb-8 flex items-center gap-3">
              <Activity className="text-slate-400" size={24} />
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/doctor/profile"
                className="group p-6 bg-slate-50 border border-slate-100 rounded-[22px] hover:bg-[#0f172a] hover:border-[#0f172a] transition-all duration-500"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#0f172a] mb-5 shadow-sm group-hover:bg-white/10 group-hover:text-white transition-colors duration-500">
                  <Settings size={20} />
                </div>
                <h4 className="text-[15px] font-bold text-slate-800 mb-2 group-hover:text-white transition-colors duration-500">Manage Profile</h4>
                <p className="text-[13px] text-slate-400 font-medium mb-0 group-hover:text-slate-300 transition-colors">Update your professional details and bio.</p>
                <div className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-[#0f172a] group-hover:text-white transition-colors">
                  <span>Open</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                to="/doctor/availability"
                className="group p-6 bg-slate-50 border border-slate-100 rounded-[22px] hover:bg-[#0f172a] hover:border-[#0f172a] transition-all duration-500"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#0f172a] mb-5 shadow-sm group-hover:bg-white/10 group-hover:text-white transition-colors duration-500">
                  <Calendar size={20} />
                </div>
                <h4 className="text-[15px] font-bold text-slate-800 mb-2 group-hover:text-white transition-colors duration-500">Manage Availability</h4>
                <p className="text-[13px] text-slate-400 font-medium mb-0 group-hover:text-slate-300 transition-colors">Set your working hours and appointment slots.</p>
                <div className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-[#0f172a] group-hover:text-white transition-colors">
                  <span>Open</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                to="/doctor/appointments"
                className="group p-6 bg-slate-50 border border-slate-100 rounded-[22px] hover:bg-[#0f172a] hover:border-[#0f172a] transition-all duration-500"
              >
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#0f172a] mb-5 shadow-sm group-hover:bg-white/10 group-hover:text-white transition-colors duration-500">
                  <ClipboardList size={20} />
                </div>
                <h4 className="text-[15px] font-bold text-slate-800 mb-2 group-hover:text-white transition-colors duration-500">View Appointments</h4>
                <p className="text-[13px] text-slate-400 font-medium mb-0 group-hover:text-slate-300 transition-colors">Check and manage your upcoming consultations.</p>
                <div className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-[#0f172a] group-hover:text-white transition-colors">
                  <span>Open</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </DoctorShell>
  );
}
