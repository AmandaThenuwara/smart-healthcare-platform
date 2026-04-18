import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  Calendar, 
  Clock, 
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  History,
  ChevronRight,
  ShieldCheck,
  Briefcase
} from "lucide-react";
import DoctorShell from "./DoctorShell";
import { getStoredDoctorProfile } from "../../api/doctorApi";
import {
  getAppointmentsByDoctor,
  updateAppointmentStatus,
} from "../../api/appointmentApi";
import type { Appointment, AppointmentStatus } from "../../types/appointment";

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "REJECTED",
  "RESCHEDULED",
  "CANCELLED",
  "COMPLETED",
];

const DOCTOR_ALLOWED_STATUS_TRANSITIONS: Record<string, Set<AppointmentStatus>> = {
  "PAYMENT_PENDING": new Set(["CONFIRMED", "REJECTED", "CANCELLED"]),
  "PENDING": new Set(["CONFIRMED", "REJECTED", "CANCELLED"]),
  "CONFIRMED": new Set(["COMPLETED", "CANCELLED"]),
  "REJECTED": new Set(),
  "RESCHEDULED": new Set(),
  "CANCELLED": new Set(),
  "COMPLETED": new Set(),
};

function sortAppointments(data: Appointment[]) {
  return [...data].sort((a, b) => {
    const first = `${a.date}T${a.timeSlot}`;
    const second = `${b.date}T${b.timeSlot}`;
    return first.localeCompare(second);
  });
}

const getStatusStyles = (status: AppointmentStatus) => {
  switch (status) {
    case 'CONFIRMED':
    case 'COMPLETED':
      return 'bg-black text-white border-black';
    case 'PENDING':
    case 'PAYMENT_PENDING':
      return 'bg-gray-100 text-gray-500 border-gray-200';
    case 'REJECTED':
    case 'CANCELLED':
      return 'bg-gray-50 text-gray-400 border-gray-200 line-through';
    default:
      return 'bg-white text-black border-gray-100 shadow-sm';
  }
};

export default function DoctorAppointmentsPage() {
  const [doctorId, setDoctorId] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingStatuses, setPendingStatuses] = useState<
    Record<string, AppointmentStatus>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedDoctor = getStoredDoctorProfile();

    if (!storedDoctor) {
      setIsLoading(false);
      return;
    }

    setDoctorId(storedDoctor.doctorId);
    void loadAppointments(storedDoctor.doctorId);
  }, []);

  async function loadAppointments(currentDoctorId: string) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getAppointmentsByDoctor(currentDoctorId);
      const sorted = sortAppointments(data);
      setAppointments(sorted);

      const nextStatuses: Record<string, AppointmentStatus> = {};
      sorted.forEach((appointment) => {
        nextStatuses[appointment.appointmentId] = appointment.status;
      });
      setPendingStatuses(nextStatuses);
    } catch (error) {
      console.error(error);
      setError("Failed to load clinical appointments");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(appointmentId: string) {
    const nextStatus = pendingStatuses[appointmentId];

    if (!nextStatus) return;

    setError("");
    setMessage("");
    setIsUpdating(appointmentId);

    try {
      const updated = await updateAppointmentStatus(appointmentId, nextStatus);

      setAppointments((prev) =>
        sortAppointments(
          prev.map((appointment) =>
            appointment.appointmentId === appointmentId ? updated : appointment
          )
        )
      );

      setPendingStatuses((prev) => ({
        ...prev,
        [appointmentId]: updated.status,
      }));

      setMessage(`Success: Appointment state migrated to ${updated.status}.`);
    } catch (error: any) {
      console.error(error);
      const detail = error.response?.data?.detail;
      setError(detail || `Error: Failed to synchronize state for ${appointmentId}`);
    } finally {
      setIsUpdating(null);
    }
  }

  return (
    <DoctorShell
      title="Appointment Queue"
      subtitle="View and manage patient visitation requests and consultation lifecycle."
    >
      {!doctorId ? (
        <div className="card-premium text-center py-20 bg-white border border-gray-100 shadow-sm">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300 mb-6">
              <Calendar size={32} />
           </div>
           <h2 className="text-xl font-bold uppercase tracking-tight">Identity Required</h2>
           <p className="text-gray-500 max-w-sm mx-auto text-sm mt-2">Initialize your doctor profile to access the appointment management system.</p>
           <Link to="/doctor/profile" className="btn-primary mt-8 inline-flex px-8 py-4 text-xs font-bold uppercase tracking-widest">Setup Profile</Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl">
                   {appointments.length} Total Records
                </div>
                <div className="px-4 py-2 bg-white text-black border border-gray-100 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-sm">
                   {appointments.filter(a => a.status === 'PENDING').length} Pending
                </div>
             </div>
             
             <button onClick={() => void loadAppointments(doctorId)} className="p-3 bg-white rounded-xl shadow-premium text-gray-400 hover:text-black transition-all border border-gray-50 self-end sm:self-auto group">
                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
             </button>
          </div>

          {(error || message) && (
             <div className="space-y-2">
                {error && <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-black font-bold text-[10px] uppercase tracking-widest flex items-center gap-3"><AlertCircle size={14} /> {error}</div>}
                {message && <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-3"><CheckCircle2 size={14} /> {message}</div>}
             </div>
          )}

          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-gray-100 border-t-black rounded-full animate-spin" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Filtering queue...</p>
             </div>
          ) : appointments.length === 0 ? (
             <div className="text-center py-32 bg-white border border-dashed border-gray-200 rounded-[3rem]">
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Circular queue empty</p>
             </div>
          ) : (
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {appointments.map((appointment) => (
                   <div key={appointment.appointmentId} className="group bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-500">
                      {/* Top Header */}
                      <div className="p-8 pb-4 flex items-start justify-between">
                         <div className="flex gap-5">
                            <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center text-gray-400 group-hover:bg-black group-hover:text-white transition-all duration-500 shadow-inner shrink-0">
                               <User size={28} />
                            </div>
                            <div className="overflow-hidden">
                               <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Record #</span>
                                  <span className="text-[10px] font-bold text-black border-b border-black leading-none">{appointment.appointmentId.slice(-8)}</span>
                               </div>
                               <h3 className="text-lg font-bold truncate uppercase tracking-tight">Patient {appointment.patientId.slice(-6)}</h3>
                               <p className="text-[11px] font-medium text-gray-500 break-words mt-1 line-clamp-1">{appointment.reason}</p>
                            </div>
                         </div>
                         <div className={`px-4 py-2 rounded-2xl border text-[10px] font-bold uppercase tracking-widest transition-all ${getStatusStyles(appointment.status)}`}>
                            {appointment.status}
                         </div>
                      </div>

                      {/* Details Grid */}
                      <div className="px-8 py-6 grid grid-cols-2 gap-6 bg-gray-50/30">
                         <div className="flex items-center gap-3">
                            <Calendar size={16} className="text-gray-300" />
                            <div>
                               <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest leading-none">Date</p>
                               <p className="text-xs font-bold text-black mt-1">{appointment.date}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <Clock size={16} className="text-gray-300" />
                            <div>
                               <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest leading-none">Slot</p>
                               <p className="text-xs font-bold text-black mt-1">{appointment.timeSlot}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <Briefcase size={16} className="text-gray-300" />
                            <div>
                               <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest leading-none">Modality</p>
                               <p className="text-xs font-bold text-black mt-1">{appointment.consultationType}</p>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <ShieldCheck size={16} className="text-gray-300" />
                            <div>
                               <p className="text-[9px] uppercase font-bold text-gray-400 tracking-widest leading-none">Security</p>
                               <p className="text-xs font-bold text-black mt-1">Verified</p>
                            </div>
                         </div>
                      </div>

                      {/* Update Section */}
                      <div className="p-8 flex flex-col sm:flex-row gap-4">
                         <div className="relative flex-1 group/sel">
                            <select
                               value={pendingStatuses[appointment.appointmentId] || appointment.status}
                               onChange={(e) => setPendingStatuses((prev) => ({
                                  ...prev,
                                  [appointment.appointmentId]: e.target.value as AppointmentStatus,
                               }))}
                               className="w-full pl-6 pr-10 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:ring-8 focus:ring-black/[0.02] focus:border-gray-200 transition-all text-[10px] font-bold uppercase tracking-widest appearance-none cursor-pointer outline-none"
                            >
                               <option value={appointment.status}>{appointment.status} (Current)</option>
                               {APPOINTMENT_STATUSES.filter(s => {
                                 const allowed = DOCTOR_ALLOWED_STATUS_TRANSITIONS[appointment.status] || new Set();
                                 return allowed.has(s);
                               }).map((status) => (
                                  <option key={status} value={status}>{status}</option>
                               ))}
                            </select>
                            <ChevronRight size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 rotate-90" />
                          </div>
                          {appointment.status === 'PAYMENT_PENDING' && (
                            <div className="absolute -top-10 left-0 right-0 text-center pointer-events-none">
                               <span className="px-3 py-1 bg-black text-white text-[8px] font-bold uppercase tracking-widest rounded-full shadow-lg">
                                  Awaiting Patient Payment
                               </span>
                            </div>
                          )}
                          <button
                             onClick={() => void handleStatusUpdate(appointment.appointmentId)}
                             className="bg-black text-white px-8 py-4 rounded-[1.25rem] text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-black/10 transition-all shrink-0 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                             disabled={isUpdating === appointment.appointmentId}
                          >
                             {isUpdating === appointment.appointmentId ? "Syncing..." : "Update State"}
                          </button>
                      </div>

                      {/* History Log */}
                      <div className="border-t border-gray-50 p-8 pt-6">
                         <div className="flex items-center gap-2 mb-4">
                            <History size={14} className="text-gray-300" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Migration Logic History</span>
                         </div>
                         <div className="space-y-3">
                            {appointment.statusHistory.length === 0 ? (
                               <p className="text-[10px] text-gray-300 italic">No historical data found for this record</p>
                            ) : (
                               appointment.statusHistory.slice(-2).reverse().map((historyItem, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50/50 rounded-xl border border-gray-50/50">
                                     <span className="text-[10px] font-bold uppercase tracking-tight">{historyItem.status}</span>
                                     <span className="text-[9px] text-gray-400 font-medium uppercase">{new Date(historyItem.changedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(historyItem.changedAt).toLocaleDateString()}</span>
                                  </div>
                               ))
                            )}
                         </div>
                      </div>
                   </div>
                ))}
             </div>
          )}
        </div>
      )}
    </DoctorShell>
  );
}
