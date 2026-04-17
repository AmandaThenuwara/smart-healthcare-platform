import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import DoctorShell from "./DoctorShell";
import {
  createAvailabilitySlot,
  getAvailabilitySlots,
  getStoredDoctorProfile,
} from "../../api/doctorApi";
import type { AvailabilitySlot } from "../../types/doctor";
import { 
  Calendar, 
  Clock, 
  Plus, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle,
  History,
  CheckCircle2,
  XCircle
} from "lucide-react";

function sortSlots(slots: AvailabilitySlot[]) {
  return [...slots].sort((a, b) => {
    const first = `${a.date}T${a.startTime}`;
    const second = `${b.date}T${b.startTime}`;
    return first.localeCompare(second);
  });
}

export default function DoctorAvailabilityPage() {
  const [doctorId, setDoctorId] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    isAvailable: true,
  });

  useEffect(() => {
    const storedDoctor = getStoredDoctorProfile();

    if (!storedDoctor) {
      setIsLoading(false);
      return;
    }

    setDoctorId(storedDoctor.doctorId);
    void loadSlots(storedDoctor.doctorId);
  }, []);

  async function loadSlots(currentDoctorId: string) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getAvailabilitySlots(currentDoctorId);
      setSlots(sortSlots(data));
    } catch (error) {
      console.error(error);
      setError("Failed to load availability slots");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!doctorId) {
      setError("Create the doctor profile first.");
      return;
    }

    if (form.startTime >= form.endTime) {
      setError("End time must be later than start time.");
      return;
    }

    try {
      await createAvailabilitySlot({
        doctorId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        isAvailable: form.isAvailable,
      });

      setMessage("Slot created.");
      setForm({
        date: "",
        startTime: "09:00",
        endTime: "10:00",
        isAvailable: true,
      });

      await loadSlots(doctorId);
    } catch (error) {
      console.error(error);
      setError("Failed to create availability slot");
    }
  }

  return (
    <DoctorShell
      title="Doctor Availability"
      subtitle="Configure your working sessions and appointment availability."
    >
      {!doctorId ? (
        <div className="bg-white rounded-[24px] p-12 shadow-soft flex flex-col items-center text-center gap-6 border border-slate-100/50">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-inner">
            <AlertCircle size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2 text-slate-800">Profile Setup Required</h2>
            <p className="text-slate-500 max-w-md font-medium leading-relaxed">
              Please create your doctor profile first so the frontend has a saved
              doctorId to associate with these slots.
            </p>
          </div>
          <Link to="/doctor/profile" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg hover:bg-slate-800 transition-all">
            Go to Profile
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-soft border border-slate-100/50 mb-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shadow-inner">
                <Plus size={20} />
              </div>
              <h2 className="text-[17px] font-bold text-slate-800">Add New Slot</h2>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">Session Date</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <Calendar size={16} className="text-slate-400" />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">Start Time</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <Clock size={16} className="text-slate-400" />
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm({ ...form, startTime: e.target.value })
                    }
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">End Time</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <Clock size={16} className="text-slate-400" />
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">Initial Status</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <ShieldCheck size={16} className="text-slate-400" />
                  <select
                    value={String(form.isAvailable)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isAvailable: e.target.value === "true",
                      })
                    }
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 font-bold appearance-none cursor-pointer"
                  >
                    <option value="true">Available</option>
                    <option value="false">Unavailable</option>
                  </select>
                </div>
              </div>

              <div className="lg:col-span-4 mt-2">
                {error && <p className="text-rose-500 text-sm font-bold mb-4 ml-1">{error}</p>}
                {message && <p className="text-emerald-500 text-sm font-bold mb-4 ml-1">{message}</p>}
                
                <button type="submit" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2.5 active:scale-95">
                  <Plus size={18} />
                  <span>Create Session Slot</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-soft border border-slate-100/50">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 shadow-inner">
                  <History size={20} />
                </div>
                <h2 className="text-[17px] font-bold text-slate-800">Review Slots</h2>
              </div>
              <button onClick={() => void loadSlots(doctorId)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-slate-600 rounded-[12px] font-bold text-[13px] border border-slate-100 hover:bg-slate-100 transition-all">
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                <span>Refresh List</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <RefreshCw size={32} className="animate-spin text-slate-300" />
                <p className="text-slate-400 font-medium tracking-tight">Syncing your schedule...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4 text-center">
                <Calendar size={48} className="text-slate-100" />
                <p className="text-slate-400 font-medium">No sessions scheduled yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-4 pl-6 text-[12px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Session Date</th>
                      <th className="p-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Time Range</th>
                      <th className="p-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Current Status</th>
                      <th className="p-4 pr-6 text-[12px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">Identifier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot) => (
                      <tr key={slot.slotId} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4 pl-6 border-b border-slate-100/50">
                          <span className="text-[14px] font-bold text-slate-800">{slot.date}</span>
                        </td>
                        <td className="p-4 border-b border-slate-100/50">
                          <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-600 bg-slate-100/50 px-3 py-1 rounded-lg w-fit">
                            <Clock size={14} className="text-slate-400" />
                            <span>{slot.startTime} — {slot.endTime}</span>
                          </div>
                        </td>
                        <td className="p-4 border-b border-slate-100/50">
                          {slot.isAvailable ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full w-fit">
                              <CheckCircle2 size={14} />
                              <span className="text-[11px] font-bold uppercase tracking-wider">Available</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-3 py-1 rounded-full w-fit">
                              <XCircle size={14} />
                              <span className="text-[11px] font-bold uppercase tracking-wider">Unavailable</span>
                            </div>
                          )}
                        </td>
                        <td className="p-4 pr-6 border-b border-slate-100/50 text-right">
                          <code className="text-[11px] font-bold text-slate-300 group-hover:text-slate-400 transition-colors uppercase">{slot.slotId.slice(-8)}</code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </DoctorShell>
  );
}
