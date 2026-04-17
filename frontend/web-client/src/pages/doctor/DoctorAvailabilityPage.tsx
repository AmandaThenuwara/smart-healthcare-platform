import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  RefreshCw,
  Info,
  ChevronRight,
  Edit2,
  AlertCircle,
  X,
  Save,
  Loader2
} from "lucide-react";
import DoctorShell from "./DoctorShell";
import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  getAvailabilitySlots,
  getStoredDoctorProfile,
  updateAvailabilitySlot,
} from "../../api/doctorApi";
import type { AvailabilitySlot } from "../../types/doctor";

function sortSlots(slots: AvailabilitySlot[]) {
  return [...slots].sort((a, b) => {
    const first = `${a.date}T${a.startTime}`;
    const second = `${b.date}T${b.startTime}`;
    return first.localeCompare(second);
  });
}

const FormField = ({ label, icon: Icon, value, onChange, placeholder, type = "text", required = false, isSelect = false, options = [] }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300 group-focus-within:text-black transition-colors duration-300">
        <Icon size={18} />
      </div>
      {isSelect ? (
        <select
          value={value}
          onChange={onChange}
          className="w-full pl-14 pr-5 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:ring-8 focus:ring-black/[0.02] focus:border-gray-200 transition-all duration-300 outline-none text-black font-bold appearance-none cursor-pointer"
          required={required}
        >
          {options.map((opt: any) => (
             <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="w-full pl-14 pr-5 py-4 bg-gray-50 border border-transparent rounded-[1.25rem] focus:bg-white focus:ring-8 focus:ring-black/[0.02] focus:border-gray-200 transition-all duration-300 outline-none text-black placeholder:text-gray-300 font-semibold"
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  </div>
);

export default function DoctorAvailabilityPage() {
  const [doctorId, setDoctorId] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  function resetForm() {
    setEditingSlotId(null);
    setForm({
      date: "",
      startTime: "09:00",
      endTime: "10:00",
      isAvailable: true,
    });
  }

  function handleEdit(slot: AvailabilitySlot) {
    setEditingSlotId(slot.slotId);
    setForm({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
    });
    setMessage("");
    setError("");
  }

  async function handleDelete(slotId: string) {
    if (!window.confirm("Delete this availability slot?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteAvailabilitySlot(slotId);
      setMessage("Availability slot deleted successfully.");
      if (editingSlotId === slotId) {
        resetForm();
      }
      await loadSlots(doctorId);
    } catch (error) {
      console.error(error);
      setError("Failed to delete availability slot");
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

    setIsSaving(true);

    try {
      if (editingSlotId) {
        await updateAvailabilitySlot(editingSlotId, {
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          isAvailable: form.isAvailable,
        });
        setMessage("Slot updated successfully.");
      } else {
        await createAvailabilitySlot({
          doctorId,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          isAvailable: form.isAvailable,
        });
        setMessage("Slot created successfully.");
      }

      resetForm();
      await loadSlots(doctorId);
    } catch (error) {
      console.error(error);
      setError(
        editingSlotId
          ? "Failed to update availability slot"
          : "Failed to create availability slot"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DoctorShell
      title="Consultation Slots"
      subtitle="Define your available time windows for patient consultations."
    >
      {!doctorId ? (
        <div className="card-premium text-center py-16 space-y-6 animate-in zoom-in duration-500 border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <Clock size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold uppercase tracking-tight">Professional Setup Required</h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm">
              Please initialize your doctor profile before managing availability slots.
            </p>
          </div>
          <div className="pt-4">
            <Link to="/doctor/profile" className="btn-primary inline-flex items-center gap-2 group text-xs">
              Go to Profile
              <Plus size={16} className="group-hover:rotate-90 transition-transform" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Create/Edit Form Card */}
          <div className="card-premium border border-gray-100 p-10">
            <div className="flex items-center justify-between pb-6 border-b border-gray-50 mb-8">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                     {editingSlotId ? <Edit2 size={22} /> : <Plus size={22} />}
                  </div>
                  <div>
                     <h3 className="text-lg font-bold uppercase tracking-tight">
                        {editingSlotId ? "Edit Slot" : "Add New Slot"}
                     </h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Consultation time management</p>
                  </div>
               </div>
               {editingSlotId && (
                  <button onClick={resetForm} className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors font-bold uppercase text-[10px] tracking-widest">
                    <X size={16} /> Cancel Edit
                  </button>
               )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <FormField 
                label="Date" 
                icon={Calendar} 
                type="date"
                value={form.date} 
                onChange={(e: any) => setForm({ ...form, date: e.target.value })} 
                required 
              />
              <FormField 
                label="Start Time" 
                icon={Clock} 
                type="time"
                value={form.startTime} 
                onChange={(e: any) => setForm({ ...form, startTime: e.target.value })} 
                required 
              />
              <FormField 
                label="End Time" 
                icon={Clock} 
                type="time"
                value={form.endTime} 
                onChange={(e: any) => setForm({ ...form, endTime: e.target.value })} 
                required 
              />
              <FormField 
                label="Visibility" 
                icon={Info} 
                isSelect
                options={[
                   { value: "true", label: "Available" },
                   { value: "false", label: "Booked/Away" }
                ]}
                value={String(form.isAvailable)} 
                onChange={(e: any) => setForm({ ...form, isAvailable: e.target.value === "true" })} 
              />

              <div className="md:col-span-4 flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-50 mt-4 gap-6">
                <div className="flex flex-col gap-1">
                   {error && <p className="text-[10px] font-bold text-black uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" /> {error}</p>}
                   {message && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><div className="w-1.5 h-1.5 bg-gray-400 rounded-full" /> {message}</p>}
                </div>
                
                <button 
                  type="submit" 
                  className="btn-primary w-full sm:w-auto flex items-center justify-center gap-4 py-4 px-10 shadow-xl shadow-black/10 disabled:opacity-30 transition-all font-bold uppercase text-[10px] tracking-widest" 
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 size={18} className="animate-spin" /> : editingSlotId ? <Save size={18} /> : <Plus size={18} />}
                  {isSaving ? "Saving..." : editingSlotId ? "Update Slot" : "Create Slot"}
                </button>
              </div>
            </form>
          </div>

          {/* List Card */}
          <div className="card-premium border border-gray-100 p-10">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold uppercase tracking-tighter">Your Schedule</h2>
                <div className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                   {slots.length} Total Slots
                </div>
              </div>
              <button onClick={() => void loadSlots(doctorId)} className="p-3 bg-white rounded-xl shadow-premium text-gray-400 hover:text-black transition-all border border-gray-50 group">
                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <Loader2 className="animate-spin text-black" size={32} />
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Syncing schedule...</p>
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
                 <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">No slots found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {slots.map((slot) => (
                    <div key={slot.slotId} className="group bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                       <div className="flex items-center justify-between mb-6">
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${slot.isAvailable ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>
                             {slot.isAvailable ? 'Available' : 'Unavailable'}
                          </div>
                          <div className="flex items-center gap-1">
                             <button onClick={() => handleEdit(slot)} className="p-2.5 text-gray-300 hover:text-black hover:bg-gray-50 rounded-xl transition-all">
                                <Edit2 size={16} />
                             </button>
                             <button onClick={() => void handleDelete(slot.slotId)} className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                <Trash2 size={16} />
                             </button>
                          </div>
                       </div>
                       
                       <div className="space-y-4">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                                <Calendar size={18} />
                             </div>
                             <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Consultation Date</p>
                                <p className="font-bold text-sm">{new Date(slot.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                             </div>
                          </div>

                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                                <Clock size={18} />
                             </div>
                             <div>
                                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Time Window</p>
                                <p className="font-bold text-sm tracking-tight">{slot.startTime} — {slot.endTime}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DoctorShell>
  );
}
