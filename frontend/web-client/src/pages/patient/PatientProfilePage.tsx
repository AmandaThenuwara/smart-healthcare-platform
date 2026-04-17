import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Users, 
  ShieldCheck,
  Save,
  Loader2,
  Info,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PatientShell from "./PatientShell";
import {
  clearStoredPatientProfile,
  createPatientProfile,
  getMyPatientProfile,
  setStoredPatientProfile,
  updatePatientProfile,
} from "../../api/patientApi";
import type { PatientProfile } from "../../types/patient";

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

function buildEmptyForm(
  userId: string,
  fullName: string,
  email: string
): PatientFormState {
  return {
    userId,
    fullName,
    email,
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  };
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

function getErrorStatus(error: unknown): number | null {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "status" in error.response &&
    typeof error.response.status === "number"
  ) {
    return error.response.status;
  }

  return null;
}

const FormField = ({ label, icon: Icon, value, onChange, placeholder, type = "text", required = false, disabled = false, isTextArea = false }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-300 group-focus-within:text-black transition-colors duration-300">
        <Icon size={18} />
      </div>
      {isTextArea ? (
        <textarea
          value={value}
          onChange={onChange}
          className="w-full pl-14 pr-5 py-5 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-8 focus:ring-black/[0.02] focus:border-gray-200 transition-all duration-300 outline-none min-h-[160px] resize-none text-black placeholder:text-gray-300 font-medium leading-relaxed"
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          className="w-full pl-14 pr-5 py-5 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-8 focus:ring-black/[0.02] focus:border-gray-200 transition-all duration-300 outline-none disabled:opacity-60 text-black placeholder:text-gray-300 font-semibold"
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
      )}
    </div>
  </div>
);

export default function PatientProfilePage() {
  const { user } = useAuth();
  const initialUserId = useMemo(() => extractUserId(user), [user]);
  const initialFullName = user?.fullName || "";
  const initialEmail = user?.email || "";

  const [existingPatient, setExistingPatient] = useState<PatientProfile | null>(null);
  const [form, setForm] = useState<PatientFormState>(
    buildEmptyForm(initialUserId, initialFullName, initialEmail)
  );

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    async function loadPatientProfile() {
      setError("");
      setMessage("");
      setIsLoadingProfile(true);

      if (!initialUserId) {
        setExistingPatient(null);
        setForm(buildEmptyForm(initialUserId, initialFullName, initialEmail));
        setIsLoadingProfile(false);
        return;
      }

      try {
        const patient = await getMyPatientProfile();
        setStoredPatientProfile(patient);
        setExistingPatient(patient);
        setForm(mapPatientToForm(patient));
      } catch (error: unknown) {
        const statusCode = getErrorStatus(error);

        if (statusCode === 404) {
          clearStoredPatientProfile();
          setExistingPatient(null);
          setForm(buildEmptyForm(initialUserId, initialFullName, initialEmail));
        } else {
          console.error(error);
          setError("Failed to load patient profile");
        }
      } finally {
        setIsLoadingProfile(false);
      }
    }

    void loadPatientProfile();
  }, [initialUserId, initialFullName, initialEmail]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
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
      <div className="card-premium border border-gray-100 p-10">
        {isLoadingProfile ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <Loader2 className="animate-spin text-black" size={40} />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading patient profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-500">
            {/* Form Section Header */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-50">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                     <User size={22} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold uppercase tracking-tight">Personal Information</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Global health profile records</p>
                  </div>
               </div>
               <div className="hidden sm:block">
                  <ChevronRight className="text-gray-200" size={24} />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <FormField 
                label="User ID" 
                icon={ShieldCheck} 
                value={form.userId} 
                onChange={(e: any) => setForm({ ...form, userId: e.target.value })} 
                placeholder="user_001" 
                required 
                disabled={!!existingPatient || isSubmitting} 
              />

              <FormField 
                label="Email" 
                icon={Mail} 
                value={form.email} 
                onChange={(e: any) => setForm({ ...form, email: e.target.value })} 
                placeholder="patient@example.com" 
                required 
                disabled={!!existingPatient || isSubmitting} 
              />

              <FormField 
                label="Full Name" 
                icon={User} 
                value={form.fullName} 
                onChange={(e: any) => setForm({ ...form, fullName: e.target.value })} 
                placeholder="John Doe" 
                required 
                disabled={isSubmitting} 
              />

              <FormField 
                label="Phone" 
                icon={Phone} 
                value={form.phone} 
                onChange={(e: any) => setForm({ ...form, phone: e.target.value })} 
                placeholder="+94 7X XXX XXXX" 
                required 
                disabled={isSubmitting} 
              />

              <FormField 
                label="Date of Birth" 
                icon={Calendar} 
                type="date"
                value={form.dateOfBirth} 
                onChange={(e: any) => setForm({ ...form, dateOfBirth: e.target.value })} 
                required 
                disabled={isSubmitting} 
              />

              <FormField 
                label="Gender" 
                icon={Users} 
                value={form.gender} 
                onChange={(e: any) => setForm({ ...form, gender: e.target.value })} 
                placeholder="Specify gender" 
                required 
                disabled={isSubmitting} 
              />

              <FormField 
                label="Emergency Contact Name" 
                icon={User} 
                value={form.emergencyContactName} 
                onChange={(e: any) => setForm({ ...form, emergencyContactName: e.target.value })} 
                placeholder="Contact name" 
                required 
                disabled={isSubmitting} 
              />

              <FormField 
                label="Emergency Contact Phone" 
                icon={Phone} 
                value={form.emergencyContactPhone} 
                onChange={(e: any) => setForm({ ...form, emergencyContactPhone: e.target.value })} 
                placeholder="Contact phone" 
                required 
                disabled={isSubmitting} 
              />
            </div>

            <FormField 
              label="Address" 
              icon={MapPin} 
              isTextArea 
              value={form.address} 
              onChange={(e: any) => setForm({ ...form, address: e.target.value })} 
              placeholder="Full registered address" 
              required 
              disabled={isSubmitting} 
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-8 border-t border-gray-50">
              <div className="flex-1 w-full text-center sm:text-left">
                {existingPatient && (
                  <div className="inline-flex items-center gap-3 px-5 py-3 bg-gray-50 text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-gray-100 shadow-sm">
                    <Info size={14} className="text-gray-400" />
                    <span>ID: <code className="bg-white px-2 py-0.5 rounded text-gray-600">{existingPatient.patientId}</code></span>
                  </div>
                )}
                
                {error && <p className="mt-4 text-xs font-bold text-black uppercase tracking-widest flex items-center justify-center sm:justify-start gap-3"><span className="w-2 h-2 rounded-full bg-black animate-pulse"></span> {error}</p>}
                {message && <p className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-3"><CheckCircleIcon size={14} /> {message}</p>}
              </div>

              <button 
                type="submit" 
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-4 py-5 shadow-2xl shadow-black/10 disabled:opacity-30 disabled:grayscale transition-all" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    <span className="uppercase tracking-widest text-xs">Requesting...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span className="uppercase tracking-widest text-xs font-bold">{existingPatient ? "Save Changes" : "Initialize Profile"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </PatientShell>
  );
}

function CheckCircleIcon({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
}