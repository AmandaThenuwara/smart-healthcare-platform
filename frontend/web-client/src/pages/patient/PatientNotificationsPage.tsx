import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getStoredPatientProfile } from "../../api/patientApi";
import {
  createNotification,
  getNotificationsByUser,
} from "../../api/notificationApi";
import type { NotificationType, UserNotification } from "../../types/notification";
import PatientShell from "./PatientShell";
import { 
  Bell, 
  Plus, 
  RefreshCw, 
  History, 
  AlertCircle,
  Tag,
  Calendar,
  CheckCircle,
  Mail,
  Info
} from "lucide-react";

const NOTIFICATION_TYPES: NotificationType[] = [
  "APPOINTMENT",
  "PAYMENT",
  "CONSULTATION",
  "GENERAL",
];

function extractUserId(user: unknown): string {
  if (user && typeof user === "object") {
    const candidate = user as {
      userId?: string;
      id?: string;
      _id?: string;
    };

    return candidate.userId || candidate.id || candidate._id || "";
  }

  return "";
}

function sortNotifications(notifications: UserNotification[]) {
  return [...notifications].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function PatientNotificationsPage() {
  const { user } = useAuth();
  const authUserId = useMemo(() => extractUserId(user), [user]);

  const [userId, setUserId] = useState("");
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    message: "",
    type: "GENERAL" as NotificationType,
  });

  useEffect(() => {
    const storedPatient = getStoredPatientProfile();
    const resolvedUserId = storedPatient?.userId || authUserId;

    if (!resolvedUserId) {
      setIsLoading(false);
      return;
    }

    setUserId(resolvedUserId);
    void loadNotifications(resolvedUserId);
  }, [authUserId]);

  async function loadNotifications(currentUserId: string) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getNotificationsByUser(currentUserId);
      setNotifications(sortNotifications(data));
    } catch (error) {
      console.error(error);
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!userId) {
      setError("Create the patient profile first or make sure a valid userId is available.");
      return;
    }

    try {
      await createNotification({
        userId,
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
      });

      setMessage("Notification created successfully.");
      setForm({
        title: "",
        message: "",
        type: "GENERAL",
      });

      await loadNotifications(userId);
    } catch (error) {
      console.error(error);
      setError("Failed to create notification");
    }
  }

  return (
    <PatientShell
      title="Notifications"
      subtitle="Create test notifications and view notifications for the current patient user."
    >
      {!userId ? (
        <div className="bg-white rounded-[24px] p-12 shadow-soft flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <AlertCircle size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2 text-slate-800">Patient Profile Needed</h2>
            <p className="text-slate-500 max-w-md">
              Please create the patient profile first so the frontend has a saved
              userId to use.
            </p>
          </div>
          <Link to="/patient/profile" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg hover:bg-slate-800 transition-all">
            Go to Patient Profile
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50 mb-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <Plus size={20} />
              </div>
              <h2 className="text-[17px] font-bold text-slate-800">Create Notification</h2>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">Title</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <Mail size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                    placeholder="Appointment Created"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">Type</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <Tag size={16} className="text-slate-400" />
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as NotificationType })
                    }
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 appearance-none"
                  >
                    {NOTIFICATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2 flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">Message</label>
                <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <Info size={18} className="text-slate-400 mt-1" />
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full min-h-[110px] bg-transparent outline-none text-[14px] text-slate-800 resize-y"
                    placeholder="Your message here..."
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2 mt-2">
                {error && <p className="text-rose-500 text-sm font-medium mb-4">{error}</p>}
                {message && <p className="text-emerald-500 text-sm font-medium mb-4">{message}</p>}
                
                <button type="submit" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2">
                  <Plus size={18} />
                  <span>Create Notification</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                  <History size={20} />
                </div>
                <h2 className="text-[17px] font-bold text-slate-800">Notification History</h2>
              </div>
              <button 
                onClick={() => void loadNotifications(userId)} 
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-[12px] font-bold text-[13px] hover:bg-slate-200 transition-all"
                disabled={isLoading}
              >
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <RefreshCw size={32} className="animate-spin text-slate-300" />
                <p className="text-slate-400 font-medium">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4 text-center">
                <Bell size={48} className="text-slate-100" />
                <p className="text-slate-400 font-medium">No notifications found yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {notifications.map((notification) => (
                  <div key={notification.notificationId} className="p-6 bg-slate-50/50 rounded-[22px] border border-slate-100 hover:bg-white hover:shadow-xl hover:border-white transition-all duration-300 group">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${notification.isRead ? "bg-slate-300" : "bg-blue-500"}`}></div>
                        <h3 className="text-[15px] font-bold text-slate-800">{notification.title}</h3>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold tracking-wider uppercase">
                        {notification.type}
                      </span>
                    </div>
                    <p className="text-[14px] text-slate-600 mb-4 leading-relaxed pl-5">{notification.message}</p>
                    <div className="flex items-center gap-4 pl-5">
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
                        <Calendar size={14} className="text-slate-300" />
                        <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-400">
                        <CheckCircle size={14} className={notification.isRead ? "text-emerald-500" : "text-slate-300"} />
                        <span>{notification.isRead ? "Read" : "Unread"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PatientShell>
  );
}
