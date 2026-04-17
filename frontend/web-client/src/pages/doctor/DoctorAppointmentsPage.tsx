import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DoctorShell from "./DoctorShell";
import { getStoredDoctorProfile } from "../../api/doctorApi";
import {
  getAppointmentsByDoctor,
  updateAppointmentStatus,
} from "../../api/appointmentApi";
import type { Appointment, AppointmentStatus } from "../../types/appointment";
import { 
  User, 
  Calendar, 
  Clock, 
  Stethoscope, 
  MessageSquare, 
  ShieldCheck, 
  History, 
  RefreshCw, 
  AlertCircle,
  Hash,
  ClipboardList,
  CheckCircle2,
  Settings2
} from "lucide-react";

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "REJECTED",
  "RESCHEDULED",
  "CANCELLED",
  "COMPLETED",
];

function sortAppointments(data: Appointment[]) {
  return [...data].sort((a, b) => {
    const first = `${a.date}T${a.timeSlot}`;
    const second = `${b.date}T${b.timeSlot}`;
    return first.localeCompare(second);
  });
}

export default function DoctorAppointmentsPage() {
  const [doctorId, setDoctorId] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingStatuses, setPendingStatuses] = useState<
    Record<string, AppointmentStatus>
  >({});
  const [isLoading, setIsLoading] = useState(true);
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
      setError("Failed to load doctor appointments");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(appointmentId: string) {
    const nextStatus = pendingStatuses[appointmentId];

    if (!nextStatus) return;

    setError("");
    setMessage("");

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

      setMessage(`Appointment updated to ${updated.status}.`);
    } catch (error) {
      console.error(error);
      setError(`Failed to update appointment status.`);
    }
  }

  return (
    <DoctorShell
      title="Doctor Appointments"
      subtitle="Track patient consultations and manage your session outcomes."
    >
      {!doctorId ? (
        <div className="bg-white rounded-[24px] p-12 shadow-soft flex flex-col items-center text-center gap-6 border border-slate-100/50">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
            <AlertCircle size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2 text-slate-800">Profile Setup Required</h2>
            <p className="text-slate-500 max-w-md font-medium leading-relaxed">
              Please create your doctor profile first so the system can fetch your appointments.
            </p>
          </div>
          <Link to="/doctor/profile" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg hover:bg-slate-800 transition-all">
            Go to Doctor Profile
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-soft border border-slate-100/50">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shadow-inner">
                <ClipboardList size={20} />
              </div>
              <h2 className="text-[17px] font-bold text-slate-800">Consultation Schedule</h2>
            </div>
            <button onClick={() => void loadAppointments(doctorId)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 rounded-[12px] font-bold text-[13px] border border-slate-100 hover:bg-slate-100 transition-all">
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
              <span>Refresh Schedule</span>
            </button>
          </div>

          {error && <p className="text-rose-500 text-[14px] font-bold mb-6 ml-1">{error}</p>}
          {message && <p className="text-emerald-500 text-[14px] font-bold mb-6 ml-1">{message}</p>}

          {isLoading ? (
            <div className="py-20 flex flex-col items-center gap-4 text-center">
              <RefreshCw size={32} className="animate-spin text-slate-300" />
              <p className="text-slate-400 font-medium tracking-tight">Syncing appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-20 flex flex-col items-center gap-4 text-center text-slate-400">
              <Calendar size={48} className="text-slate-100" />
              <p className="font-medium">No appointments found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {appointments.map((appointment) => (
                <div key={appointment.appointmentId} className="bg-slate-50/50 rounded-[28px] border border-slate-100 p-8 hover:bg-white hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                  <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash size={14} className="text-slate-300" />
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{appointment.appointmentId}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                            <User size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Patient</p>
                            <p className="text-[14px] font-bold text-slate-700 truncate">{appointment.patientId}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                            <Calendar size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Date</p>
                            <p className="text-[14px] font-bold text-slate-700">{appointment.date}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                            <Clock size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Time Slot</p>
                            <p className="text-[14px] font-bold text-slate-700">{appointment.timeSlot}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                            <Stethoscope size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Consultation</p>
                            <p className="text-[14px] font-bold text-slate-700">{appointment.consultationType}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <div className="flex items-start gap-3">
                          <MessageSquare size={16} className="text-slate-300 mt-0.5" />
                          <p className="text-[13.5px] text-slate-500 font-medium leading-relaxed italic">“{appointment.reason}”</p>
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-[320px] flex flex-col gap-6">
                      <div className="bg-white p-6 rounded-[22px] border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Action Status</label>
                          <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            appointment.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {appointment.status}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-100 transition-all">
                            <Settings2 size={16} className="text-slate-400" />
                            <select
                              value={pendingStatuses[appointment.appointmentId] || appointment.status}
                              onChange={(e) =>
                                setPendingStatuses((prev) => ({
                                  ...prev,
                                  [appointment.appointmentId]: e.target.value as AppointmentStatus,
                                }))
                              }
                              className="w-full py-3 bg-transparent outline-none text-[13px] text-slate-700 font-bold appearance-none cursor-pointer"
                            >
                              {APPOINTMENT_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={() => void handleStatusUpdate(appointment.appointmentId)}
                            className="bg-[#0f172a] text-white py-3 rounded-[12px] font-bold text-[13px] hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                          >
                            <CheckCircle2 size={16} />
                            <span>Update</span>
                          </button>
                        </div>
                      </div>

                      <div className="px-2">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <History size={14} />
                          History
                        </h4>
                        <div className="space-y-3">
                          {appointment.statusHistory.length === 0 ? (
                            <p className="text-[12px] text-slate-300 italic ml-6">Initial request created.</p>
                          ) : (
                            appointment.statusHistory.slice(-2).map((historyItem, index) => (
                              <div key={index} className="flex gap-3 pl-2">
                                <div className="flex flex-col items-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-slate-200 mt-1.5"></div>
                                  <div className="w-[1px] h-full bg-slate-100 ml-0.5"></div>
                                </div>
                                <div>
                                  <p className="text-[12px] font-bold text-slate-600 leading-none mb-1">{historyItem.status}</p>
                                  <p className="text-[10px] font-medium text-slate-400">{new Date(historyItem.changedAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
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
