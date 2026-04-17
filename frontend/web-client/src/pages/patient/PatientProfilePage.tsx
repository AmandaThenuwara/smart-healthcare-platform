import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "../../context/AuthContext";
import PatientShell from "./PatientShell";
import {
  createPatientProfile,
  getStoredPatientProfile,
  setStoredPatientProfile,
  updatePatientProfile,
} from "../../api/patientApi";
import type { PatientProfile } from "../../types/patient";
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Mail, 
  Users, 
  ShieldCheck, 
  Save, 
  Info,
  UserPlus
} from "lucide-react";

type PatientFormState = {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

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

function mapPatientToForm(patient: PatientProfile): PatientFormState {
  return {
    userId: patient.userId,
    fullName: patient.fullName,
    email: patient.email,
    phone: patient.phone,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    address: patient.address,
    emergencyContactName: patient.emergencyContactName,
    emergencyContactPhone: patient.emergencyContactPhone,
  };
}

export default function PatientProfilePage() {
  const { user } = useAuth();
  const initialUserId = useMemo(() => extractUserId(user), [user]);

  const [existingPatient, setExistingPatient] = useState<PatientProfile | null>(null);
  const [form, setForm] = useState<PatientFormState>({
    userId: initialUserId,
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedPatient = getStoredPatientProfile();

    if (storedPatient) {
      setExistingPatient(storedPatient);
      setForm(mapPatientToForm(storedPatient));
      return;
    }

    setForm((prev) => ({
      ...prev,
      userId: prev.userId || initialUserId,
      fullName: prev.fullName || user?.fullName || "",
      email: prev.email || user?.email || "",
    }));
  }, [initialUserId, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    // --- Validations ---
    const phoneRegex = /^[0-9]{10}$/;
    
    if (form.fullName.trim().length < 3) {
      setError("Full name must be at least 3 characters long.");
      return;
    }

    if (!phoneRegex.test(form.phone.trim())) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    if (form.dateOfBirth) {
      const selectedDate = new Date(form.dateOfBirth);
      const today = new Date();
      if (selectedDate > today) {
        setError("Date of birth cannot be in the future.");
        return;
      }
    }

    if (form.address.trim().length < 5) {
      setError("Please enter a complete address.");
      return;
    }

    if (!phoneRegex.test(form.emergencyContactPhone.trim())) {
      setError("Emergency contact must be a valid 10-digit phone number.");
      return;
    }
    // -------------------

    setIsSubmitting(true);

    try {
      if (!existingPatient) {
        const createdPatient = await createPatientProfile({
          userId: form.userId.trim(),
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          dateOfBirth: form.dateOfBirth,
          gender: form.gender.trim(),
          address: form.address.trim(),
          emergencyContactName: form.emergencyContactName.trim(),
          emergencyContactPhone: form.emergencyContactPhone.trim(),
        });

        setStoredPatientProfile(createdPatient);
        setExistingPatient(createdPatient);
        setForm(mapPatientToForm(createdPatient));
        setMessage("Patient profile created successfully.");
      } else {
        const updatedPatient = await updatePatientProfile(existingPatient.patientId, {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          dateOfBirth: form.dateOfBirth,
          gender: form.gender.trim(),
          address: form.address.trim(),
          emergencyContactName: form.emergencyContactName.trim(),
          emergencyContactPhone: form.emergencyContactPhone.trim(),
        });

        setStoredPatientProfile(updatedPatient);
        setExistingPatient(updatedPatient);
        setForm(mapPatientToForm(updatedPatient));
        setMessage("Patient profile updated successfully.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to save patient profile");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PatientShell
      title="Profile"
      subtitle="Complete your personal information to access all services."
    >
      <div className="bg-white rounded-[24px] p-8 md:p-12 shadow-soft border border-slate-100/50">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <UserPlus size={20} />
          </div>
          <h2 className="text-[17px] font-bold text-slate-800">Personal Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">User ID</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <ShieldCheck size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                  placeholder="user_001"
                  required
                  disabled={!!existingPatient || isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Email</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Mail size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                  placeholder="patient@example.com"
                  required
                  disabled={!!existingPatient || isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Full Name</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <User size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                  placeholder="John Doe"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Phone</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Phone size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                  placeholder="0771234567"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Date of Birth</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Calendar size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm({ ...form, dateOfBirth: e.target.value })
                  }
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Gender</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Users size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                  placeholder="Male"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Emergency Contact Name</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <User size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={form.emergencyContactName}
                  onChange={(e) =>
                    setForm({ ...form, emergencyContactName: e.target.value })
                  }
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                  placeholder="Jane Doe"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Emergency Contact Phone</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Phone size={18} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={form.emergencyContactPhone}
                  onChange={(e) =>
                    setForm({ ...form, emergencyContactPhone: e.target.value })
                  }
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                  placeholder="0777654321"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-600 ml-1">Address</label>
            <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
              <MapPin size={18} className="text-slate-400 flex-shrink-0 mt-1" />
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full min-h-[120px] bg-transparent outline-none text-[14px] text-slate-800 resize-y font-inherit"
                placeholder="123 Main Street, Colombo"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {existingPatient && (
            <div className="mt-8 flex items-center gap-3 px-6 py-4 bg-slate-50 text-slate-600 rounded-[15px] border border-slate-100 text-[13px] font-medium">
              <Info size={18} className="text-slate-400" />
              <span><strong>Current patientId:</strong> {existingPatient.patientId}</span>
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-slate-100">
            {error && <p className="mb-4 text-rose-500 text-sm font-medium">{error}</p>}
            {message && <p className="mb-4 text-emerald-500 text-sm font-medium">{message}</p>}

            <button type="submit" className="flex items-center gap-2.5 bg-[#0f172a] text-white px-10 py-4 rounded-[15px] font-bold text-[14px] shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50" disabled={isSubmitting}>
              <Save size={18} />
              <span>
                {isSubmitting
                  ? "Saving..."
                  : existingPatient
                    ? "Update Patient Profile"
                    : "Create Patient Profile"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </PatientShell>
  );
}
