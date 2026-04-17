import { Link } from "react-router-dom";
import DoctorShell from "./DoctorShell";
import { getStoredDoctorProfile } from "../../api/doctorApi";
import TelemedicineManager from "../../components/telemedicine/TelemedicineManager";
import { AlertCircle, UserPlus } from "lucide-react";

export default function DoctorTelemedicinePage() {
  const doctor = getStoredDoctorProfile();

  return (
    <DoctorShell
      title="Telemedicine"
      subtitle="Create, find, update, and join secure video consultations."
    >
      {!doctor ? (
        <div className="bg-white rounded-[24px] p-12 shadow-soft flex flex-col items-center text-center gap-6 border border-slate-100/50">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
            <AlertCircle size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2 text-slate-800">Doctor Profile Needed</h2>
            <p className="text-slate-500 max-w-md font-medium leading-relaxed">
              Please create the doctor profile first so the system can link your unique
              ID to secure telemedicine sessions.
            </p>
          </div>
          <Link to="/doctor/profile" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
            <UserPlus size={18} />
            <span>Go to Doctor Profile</span>
          </Link>
        </div>
      ) : (
        <TelemedicineManager initialDoctorId={doctor.doctorId} initialPatientId="" />
      )}
    </DoctorShell>
  );
}
