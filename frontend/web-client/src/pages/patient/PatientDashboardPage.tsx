import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  Calendar, 
  FileText, 
  Bell, 
  ArrowRight,
  ShieldCheck,
  Hash,
  ChevronRight,
  Plus,
  Stethoscope
} from "lucide-react";
import PatientShell from "./PatientShell";
import {
  getMedicalReportsByPatient,
  getStoredPatientProfile,
} from "../../api/patientApi";
import { getNotificationsByUser } from "../../api/notificationApi";
import { getAppointmentsByPatient } from "../../api/appointmentApi";
import LifePulseIcon from "../../assets/img/LifePulse icon.png";

const StatCard = ({ label, value, icon: Icon }: any) => (
  <div className="card-premium flex flex-col justify-between border border-gray-100 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-100 shadow-sm text-black">
        <Icon size={24} />
      </div>
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-lg font-bold tracking-tight text-black break-words line-clamp-1">{value}</h3>
    </div>
  </div>
);

export default function PatientDashboardPage() {
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [userId, setUserId] = useState("");
  const [reportCount, setReportCount] = useState<number>(0);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [appointmentCount, setAppointmentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const storedPatient = getStoredPatientProfile();

      if (!storedPatient) {
        setIsLoading(false);
        return;
      }

      setPatientName(storedPatient.fullName);
      setPatientId(storedPatient.patientId);
      setUserId(storedPatient.userId);

      try {
        const [reports, notifications, appointments] = await Promise.all([
          getMedicalReportsByPatient(storedPatient.patientId),
          getNotificationsByUser(storedPatient.userId),
          getAppointmentsByPatient(storedPatient.patientId),
        ]);

        setReportCount(reports.length);
        setNotificationCount(notifications.length);
        setAppointmentCount(appointments.length);
      } catch (error) {
        console.error("Failed to load patient dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboardData();
  }, []);

  return (
    <PatientShell
      title="Dashboard"
      subtitle="Welcome back! Here's an overview of your health status and recent activities."
    >
      {!patientId ? (
        <div className="card-premium text-center py-16 space-y-6 border border-gray-100">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-black">
            <User size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Profile Setup Required</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              You haven't completed your patient profile yet. Please set up your profile to access all healthcare services.
            </p>
          </div>
          <div className="pt-4">
            <Link to="/patient/profile" className="btn-primary inline-flex items-center gap-2">
              Complete Profile
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard label="Patient Name" value={patientName} icon={User} />
            <StatCard label="Patient ID" value={patientId} icon={Hash} />
            <StatCard label="User ID" value={userId} icon={ShieldCheck} />
            <StatCard label="Appointments" value={isLoading ? "..." : appointmentCount} icon={Calendar} />
            <StatCard label="Medical Reports" value={isLoading ? "..." : reportCount} icon={FileText} />
            <StatCard label="Notifications" value={isLoading ? "..." : notificationCount} icon={Bell} />
          </div>

          {/* Quick Actions */}
          <div className="card-premium border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold uppercase tracking-tight">Quick Actions</h2>
              <div className="p-2 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                <img src={LifePulseIcon} alt="Icon" className="w-5 h-5 object-contain" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/patient/doctors" className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-transparent shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black">
                       <Plus size={20} />
                    </div>
                    <span className="font-bold text-sm text-gray-800">Book Appointment</span>
                 </div>
                 <ArrowRight size={18} className="text-gray-400" />
              </Link>

              <Link to="/patient/reports" className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-transparent shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black">
                       <FileText size={20} />
                    </div>
                    <span className="font-bold text-sm text-gray-800">View Reports</span>
                 </div>
                 <ArrowRight size={18} className="text-gray-400" />
              </Link>

              <Link to="/patient/telemedicine" className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-transparent shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black">
                       <Stethoscope size={20} />
                    </div>
                    <span className="font-bold text-sm text-gray-800">Telemedicine</span>
                 </div>
                 <ArrowRight size={18} className="text-gray-400" />
              </Link>

              <Link to="/patient/notifications" className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-transparent shadow-sm">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black">
                       <Bell size={20} />
                    </div>
                    <span className="font-bold text-sm text-gray-800">Notifications</span>
                 </div>
                 <ArrowRight size={18} className="text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </PatientShell>
  );
}
