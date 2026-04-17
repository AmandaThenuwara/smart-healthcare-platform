import { Link } from "react-router-dom";
import { 
  Stethoscope, 
  Video, 
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import DoctorShell from "./DoctorShell";
import { getStoredDoctorProfile } from "../../api/doctorApi";
import TelemedicineManager from "../../components/telemedicine/TelemedicineManager";

export default function DoctorTelemedicinePage() {
  const doctor = getStoredDoctorProfile();

  return (
    <DoctorShell
      title="Clinic Console"
      subtitle="Establish secure video links and manage active consultation sessions."
    >
      {!doctor ? (
        <div className="card-premium text-center py-20 animate-in zoom-in duration-500 border border-gray-100 bg-white">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300 mb-6">
              <ShieldAlert size={32} />
           </div>
           <h2 className="text-xl font-bold uppercase tracking-tight">Access Restricted</h2>
           <p className="text-gray-500 max-w-sm mx-auto text-sm mt-2">A verified doctor profile is required to initialize the telemedicine infrastructure.</p>
           <Link to="/doctor/profile" className="btn-primary mt-8 inline-flex px-8 py-4 text-xs font-bold uppercase tracking-widest gap-3 group">
              Complete Setup 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
           </Link>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in duration-700">
           {/* Telemedicine Logic Header */}
           <div className="card-premium border border-gray-100 p-8 flex flex-col md:flex-row items-center justify-between gap-8 bg-black text-white relative overflow-hidden">
              <div className="relative z-10 flex items-center gap-6">
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-xl">
                    <Video size={32} className="text-white" />
                 </div>
                 <div>
                    <h2 className="text-xl font-bold uppercase tracking-tighter">Secure Link Protocol</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">End-to-end encrypted virtual consultation</p>
                 </div>
              </div>
              
              <div className="relative z-10 flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10">
                 <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Infrastructure Active</span>
              </div>
              
              {/* Decorative Blur */}
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           </div>

           <div className="card-premium border border-gray-100 p-10 bg-white">
              <TelemedicineManager initialDoctorId={doctor.doctorId} initialPatientId="" />
           </div>
        </div>
      )}
    </DoctorShell>
  );
}
