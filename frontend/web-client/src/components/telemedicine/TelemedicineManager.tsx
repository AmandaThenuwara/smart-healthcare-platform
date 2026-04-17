import { useMemo, useState, type FormEvent } from "react";
import {
  createTelemedicineSession,
  getTelemedicineByAppointment,
  getTelemedicineSession,
  updateTelemedicineStatus,
} from "../../api/telemedicineApi";
import type {
  TelemedicineSession,
  TelemedicineStatus,
} from "../../types/telemedicine";
import { 
  Video, 
  Plus, 
  Search, 
  RefreshCw, 
  Calendar, 
  User, 
  Stethoscope, 
  Link as LinkIcon, 
  Info,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";

type TelemedicineManagerProps = {
  initialDoctorId: string;
  initialPatientId: string;
};

const TELEMEDICINE_STATUSES: TelemedicineStatus[] = [
  "SCHEDULED",
  "STARTED",
  "ENDED",
];

export default function TelemedicineManager({
  initialDoctorId,
  initialPatientId,
}: TelemedicineManagerProps) {
  const defaultMeetingUrl = useMemo(() => "", []);

  const [form, setForm] = useState({
    appointmentId: "",
    doctorId: initialDoctorId,
    patientId: initialPatientId,
    roomName: "",
    meetingUrl: defaultMeetingUrl,
  });

  const [appointmentLookupId, setAppointmentLookupId] = useState("");
  const [sessionLookupId, setSessionLookupId] = useState("");
  const [currentSession, setCurrentSession] = useState<TelemedicineSession | null>(
    null
  );
  const [statusSelection, setStatusSelection] =
    useState<TelemedicineStatus>("SCHEDULED");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsBusy(true);

    try {
      const roomName = form.roomName.trim();
      const meetingUrl =
        form.meetingUrl.trim() || `https://meet.jit.si/${roomName}`;

      const created = await createTelemedicineSession({
        appointmentId: form.appointmentId.trim(),
        doctorId: form.doctorId.trim(),
        patientId: form.patientId.trim(),
        provider: "JITSI",
        roomName,
        meetingUrl,
        status: "SCHEDULED",
      });

      setCurrentSession(created);
      setStatusSelection(created.status);
      setAppointmentLookupId(created.appointmentId);
      setSessionLookupId(created.sessionId);
      setMessage("Telemedicine session created successfully.");
    } catch (error) {
      console.error(error);
      setError("Failed to create telemedicine session");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLookupByAppointment() {
    if (!appointmentLookupId.trim()) {
      setError("Enter an appointment ID first.");
      return;
    }

    setError("");
    setMessage("");
    setIsBusy(true);

    try {
      const session = await getTelemedicineByAppointment(appointmentLookupId.trim());
      setCurrentSession(session);
      setStatusSelection(session.status);
      setMessage("Telemedicine session loaded.");
    } catch (error) {
      console.error(error);
      setError("Failed to load telemedicine session.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLookupBySession() {
    if (!sessionLookupId.trim()) {
      setError("Enter a session ID first.");
      return;
    }

    setError("");
    setMessage("");
    setIsBusy(true);

    try {
      const session = await getTelemedicineSession(sessionLookupId.trim());
      setCurrentSession(session);
      setStatusSelection(session.status);
      setMessage("Telemedicine session loaded.");
    } catch (error) {
      console.error(error);
      setError("Failed to load telemedicine session.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStatusUpdate() {
    if (!currentSession) {
      setError("Load or create a telemedicine session first.");
      return;
    }

    setError("");
    setMessage("");
    setIsBusy(true);

    try {
      const updated = await updateTelemedicineStatus(
        currentSession.sessionId,
        statusSelection
      );
      setCurrentSession(updated);
      setMessage(`Telemedicine session updated to ${updated.status}.`);
    } catch (error) {
      console.error(error);
      setError("Failed to update telemedicine session status");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <Plus size={20} />
          </div>
          <h2 className="text-[17px] font-bold text-slate-800">Create Telemedicine Session</h2>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-600 ml-1">Appointment ID</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="text"
                value={form.appointmentId}
                onChange={(e) => setForm({ ...form, appointmentId: e.target.value })}
                className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                placeholder="ID..."
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-600 ml-1">Doctor ID</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
              <Stethoscope size={16} className="text-slate-400" />
              <input
                type="text"
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                placeholder="ID..."
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-600 ml-1">Patient ID</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
              <User size={16} className="text-slate-400" />
              <input
                type="text"
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                placeholder="ID..."
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-600 ml-1">Room Name</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
              <Video size={16} className="text-slate-400" />
              <input
                type="text"
                value={form.roomName}
                onChange={(e) => setForm({ ...form, roomName: e.target.value })}
                className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                placeholder="consult-room-001"
                required
              />
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-600 ml-1">Meeting URL</label>
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
              <LinkIcon size={16} className="text-slate-400" />
              <input
                type="text"
                value={form.meetingUrl}
                onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
                className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                placeholder="Leave blank to auto-generate from room name"
              />
            </div>
          </div>

          <div className="lg:col-span-4 mt-2">
            {error && <p className="text-rose-500 text-sm font-medium mb-4">{error}</p>}
            {message && <p className="text-emerald-500 text-sm font-medium mb-4">{message}</p>}
            
            <button type="submit" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50" disabled={isBusy}>
              <Plus size={18} />
              <span>{isBusy ? "Processing..." : "Create Session"}</span>
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <Search size={20} />
          </div>
          <h2 className="text-[17px] font-bold text-slate-800">Find Existing Session</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-3">
            <label className="text-[13px] font-bold text-slate-600 ml-1">Lookup by Appointment ID</label>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Calendar size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={appointmentLookupId}
                  onChange={(e) => setAppointmentLookupId(e.target.value)}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                  placeholder="ID..."
                />
              </div>
              <button
                onClick={() => void handleLookupByAppointment()}
                className="bg-slate-100 text-slate-700 px-6 py-3 rounded-[12px] font-bold text-[13px] hover:bg-slate-200 transition-all flex items-center justify-center gap-2 self-start"
                disabled={isBusy}
              >
                <RefreshCw size={16} className={isBusy ? "animate-spin" : ""} />
                <span>Load by Appointment</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[13px] font-bold text-slate-600 ml-1">Lookup by Session ID</label>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Info size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={sessionLookupId}
                  onChange={(e) => setSessionLookupId(e.target.value)}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                  placeholder="ID..."
                />
              </div>
              <button
                onClick={() => void handleLookupBySession()}
                className="bg-slate-100 text-slate-700 px-6 py-3 rounded-[12px] font-bold text-[13px] hover:bg-slate-200 transition-all flex items-center justify-center gap-2 self-start"
                disabled={isBusy}
              >
                <RefreshCw size={16} className={isBusy ? "animate-spin" : ""} />
                <span>Load by Session</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <Video size={20} />
          </div>
          <h2 className="text-[17px] font-bold text-slate-800">Current Session Details</h2>
        </div>

        {!currentSession ? (
          <div className="py-12 flex flex-col items-center gap-4 text-center">
            <Video size={40} className="text-slate-100" />
            <p className="text-slate-400 font-medium">No telemedicine session loaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="p-5 pl-6 bg-slate-50/50 rounded-[22px] border border-slate-100 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                    <Info size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Session ID</p>
                    <p className="text-[14px] font-bold text-slate-800 truncate">{currentSession.sessionId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                    <Calendar size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Appointment</p>
                    <p className="text-[14px] font-bold text-slate-800 truncate">{currentSession.appointmentId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Patient</p>
                    <p className="text-[14px] font-bold text-slate-800 truncate">{currentSession.patientId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                    <Stethoscope size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Doctor</p>
                    <p className="text-[14px] font-bold text-slate-800 truncate">{currentSession.doctorId}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="p-6 bg-[#0f172a] rounded-[22px] text-white shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status: {currentSession.status}</span>
                  </div>
                  <LinkIcon size={16} className="text-slate-500" />
                </div>
                <h4 className="text-[17px] font-bold mb-2">Live Consultation</h4>
                <p className="text-[13px] text-slate-400 mb-6 font-medium">Click the button below to join the secure video session.</p>
                <a
                  href={currentSession.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 bg-white text-[#0f172a] py-4 rounded-[15px] font-bold text-[14px] hover:bg-slate-100 transition-all"
                >
                  <ExternalLink size={18} />
                  <span>Join Session Now</span>
                </a>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-100 rounded-[22px]">
                <label className="text-[13px] font-bold text-slate-600 ml-1 mb-3 block">Update Session Status</label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 bg-white border border-slate-200 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-100 transition-all">
                    <Clock size={16} className="text-slate-400" />
                    <select
                      value={statusSelection}
                      onChange={(e) =>
                        setStatusSelection(e.target.value as TelemedicineStatus)
                      }
                      className="w-full py-3 bg-transparent outline-none text-[14px] text-slate-800 font-bold appearance-none cursor-pointer"
                    >
                      {TELEMEDICINE_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => void handleStatusUpdate()}
                    className="flex items-center justify-center gap-2 bg-[#0f172a] text-white py-3.5 rounded-[12px] font-bold text-[13px] hover:bg-slate-800 transition-all flex-shrink-0"
                    disabled={isBusy}
                  >
                    <CheckCircle size={16} />
                    <span>Update Status</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
