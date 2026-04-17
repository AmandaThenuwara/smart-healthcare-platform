import { Link } from "react-router-dom";
import PatientShell from "./PatientShell";
import { getStoredPatientProfile } from "../../api/patientApi";
import TelemedicineManager from "../../components/telemedicine/TelemedicineManager";
import { AlertCircle, UserPlus } from "lucide-react";

export default function PatientTelemedicinePage() {
  const patient = getStoredPatientProfile();

  return (
    <PatientShell
      title="Telemedicine"
      subtitle="Create, find, update, and join telemedicine sessions as a patient."
    >
      {!patient ? (
        <div className="bg-white rounded-[24px] p-12 shadow-soft flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <AlertCircle size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2 text-slate-800">Patient Profile Needed</h2>
            <p className="text-slate-500 max-w-md">
              Please create the patient profile first so the frontend can prefill
              the patientId for telemedicine sessions.
            </p>
          </div>
          <Link to="/patient/profile" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2">
            <UserPlus size={18} />
            <span>Go to Patient Profile</span>
          </Link>
        </div>
      ) : (
        <TelemedicineManager initialDoctorId="" initialPatientId={patient.patientId} />
      )}
    </PatientShell>
  );
}
