import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PatientShell from "./PatientShell";
import {
  getMedicalReportsByPatient,
  getStoredPatientProfile,
} from "../../api/patientApi";
import { getNotificationsByUser } from "../../api/notificationApi";
import { 
  User, 
  IdCard, 
  Fingerprint, 
  FileText, 
  Bell, 
  ArrowRight,
  ShieldAlert
} from "lucide-react";

export default function PatientDashboardPage() {
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [userId, setUserId] = useState("");
  const [reportCount, setReportCount] = useState<number>(0);
  const [notificationCount, setNotificationCount] = useState<number>(0);
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
        const [reports, notifications] = await Promise.all([
          getMedicalReportsByPatient(storedPatient.patientId),
          getNotificationsByUser(storedPatient.userId),
        ]);

        setReportCount(reports.length);
        setNotificationCount(notifications.length);
      } catch (error) {
        console.error("Failed to load patient dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboardData();
  }, []);

  const stats = [
    { label: "Patient Name", value: patientName, icon: User, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "Patient ID", value: patientId, icon: IdCard, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "User ID", value: userId, icon: Fingerprint, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "Medical Reports", value: isLoading ? "..." : reportCount, icon: FileText, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "Notifications", value: isLoading ? "..." : notificationCount, icon: Bell, color: "text-slate-600", bg: "bg-slate-100" },
  ];

  return (
    <PatientShell
      title="Dashboard"
      subtitle="Welcome back! Here's what's happening today."
    >
      {!patientId ? (
        <div className="bg-white rounded-xl p-12 shadow-soft flex gap-8 items-center">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={32} className="text-rose-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-4">Profile Setup Required</h2>
            <p className="text-secondary mb-6 leading-relaxed">
              No patient profile is linked in the frontend yet. Create your patient
              profile first, then reports and notifications will use that saved record.
            </p>
            <Link to="/patient/profile" className="flex items-center gap-2.5 bg-primary text-white px-6 py-3.5 rounded-md font-semibold text-[15px] w-fit hover:bg-slate-800 transition-colors">
              <span>Complete Profile Setup</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {stats.slice(0, 3).map((stat, idx) => (
              <div key={idx} className="bg-white rounded-[24px] p-8 shadow-soft flex flex-col gap-1 border border-slate-100/50">
                <div className="mb-4">
                  <div className={`w-12 h-12 ${stat.bg} rounded-[14px] flex items-center justify-center`}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                </div>
                <p className="text-slate-400 text-[13px] font-medium m-0">{stat.label}</p>
                <h3 className="text-[15px] font-bold text-slate-800 break-all leading-tight">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {stats.slice(3).map((stat, idx) => (
              <div key={idx} className="bg-white rounded-[24px] p-8 shadow-soft flex flex-col gap-1 border border-slate-100/50">
                <div className="mb-4">
                  <div className={`w-12 h-12 ${stat.bg} rounded-[14px] flex items-center justify-center`}>
                    <stat.icon size={20} className={stat.color} />
                  </div>
                </div>
                <p className="text-slate-400 text-[13px] font-medium m-0">{stat.label}</p>
                <h3 className="text-[15px] font-bold text-slate-800 break-all leading-tight">{stat.value}</h3>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50">
            <h2 className="text-[15px] font-bold mb-6 text-slate-800">Quick Actions</h2>
            <div className="flex gap-4 flex-wrap">
              <Link to="/patient/profile" className="flex items-center gap-2.5 bg-[#0f172a] text-white px-7 py-3.5 rounded-[15px] font-bold text-[13.5px] shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">
                <User size={18} />
                <span>Manage Profile</span>
              </Link>
              <Link to="/patient/reports" className="flex items-center gap-2.5 bg-slate-100 text-slate-700 px-7 py-3.5 rounded-[15px] font-bold text-[13.5px] hover:bg-slate-200 transition-all">
                <FileText size={18} />
                <span>Manage Reports</span>
              </Link>
              <Link to="/patient/notifications" className="flex items-center gap-2.5 bg-slate-100 text-slate-700 px-7 py-3.5 rounded-[15px] font-bold text-[13.5px] hover:bg-slate-200 transition-all">
                <Bell size={18} />
                <span>View Notifications</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </PatientShell>
  );
}


