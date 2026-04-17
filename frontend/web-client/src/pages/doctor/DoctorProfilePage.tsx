import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { 
  User, 
  Mail, 
  Stethoscope, 
  GraduationCap, 
  Hospital, 
  CreditCard, 
  ShieldCheck,
  Save,
  Loader2,
  Info,
  ChevronRight,
  FileText
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import DoctorShell from "./DoctorShell";
import {
  clearStoredDoctorProfile,
  createDoctorProfile,
  getMyDoctorProfile,
  setStoredDoctorProfile,
  updateDoctorProfile,
} from "../../api/doctorApi";
import type { DoctorApprovalStatus, DoctorProfile } from "../../types/doctor";

type DoctorFormState = {
  userId: string;
  fullName: string;
  email: string;
  specialty: string;
  qualifications: string;
  hospital: string;
  consultationFee: string;
  bio: string;
  approvalStatus: DoctorApprovalStatus;
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

function buildEmptyForm(userId: string, fullName: string, email: string): DoctorFormState {
  return {
    userId,
    fullName,
    email,
    specialty: "",
    qualifications: "",
    hospital: "",
    consultationFee: "",
    bio: "",
    approvalStatus: "PENDING",
  };
}

function mapDoctorToForm(doctor: DoctorProfile): DoctorFormState {
  return {
    userId: doctor.userId,
    fullName: doctor.fullName,
    email: doctor.email,
    specialty: doctor.specialty,
    qualifications: doctor.qualifications,
    hospital: doctor.hospital,
    consultationFee: String(doctor.consultationFee),
    bio: doctor.bio,
    approvalStatus: doctor.approvalStatus,
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

const FormField = ({ label, icon: Icon, value, onChange, placeholder, type = "text", required = false, disabled = false, isTextArea = false, isSelect = false, options = [] }: any) => (
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
      ) : isSelect ? (
        <select
          value={value}
          onChange={onChange}
          className="w-full pl-14 pr-5 py-5 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-8 focus:ring-black/[0.02] focus:border-gray-200 transition-all duration-300 outline-none text-black font-bold appearance-none cursor-pointer"
          required={required}
          disabled={disabled}
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
          className="w-full pl-14 pr-5 py-5 bg-gray-50 border border-transparent rounded-[1.5rem] focus:bg-white focus:ring-8 focus:ring-black/[0.02] focus:border-gray-200 transition-all duration-300 outline-none disabled:opacity-60 text-black placeholder:text-gray-300 font-semibold"
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
      )}
    </div>
  </div>
);

export default function DoctorProfilePage() {
  const { user } = useAuth();

  const initialUserId = useMemo(() => extractUserId(user), [user]);
  const initialFullName = user?.fullName || "";
  const initialEmail = user?.email || "";

  const [existingDoctor, setExistingDoctor] = useState<DoctorProfile | null>(null);
  const [form, setForm] = useState<DoctorFormState>(
    buildEmptyForm(initialUserId, initialFullName, initialEmail)
  );

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    async function loadDoctorProfile() {
      setError("");
      setMessage("");
      setIsLoadingProfile(true);

      if (!initialUserId) {
        setExistingDoctor(null);
        setForm(buildEmptyForm(initialUserId, initialFullName, initialEmail));
        setIsLoadingProfile(false);
        return;
      }

      try {
        const doctor = await getMyDoctorProfile();
        setStoredDoctorProfile(doctor);
        setExistingDoctor(doctor);
        setForm(mapDoctorToForm(doctor));
      } catch (error: unknown) {
        const statusCode = getErrorStatus(error);

        if (statusCode === 404) {
          clearStoredDoctorProfile();
          setExistingDoctor(null);
          setForm(buildEmptyForm(initialUserId, initialFullName, initialEmail));
        } else {
          console.error(error);
          setError("Failed to load doctor profile");
        }
      } finally {
        setIsLoadingProfile(false);
      }
    }

    void loadDoctorProfile();
  }, [initialUserId, initialFullName, initialEmail]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!form.consultationFee.trim()) {
        throw new Error("Consultation fee is required");
      }

      const consultationFee = Number(form.consultationFee);

      if (Number.isNaN(consultationFee)) {
        throw new Error("Consultation fee must be a valid number");
      }

      if (!existingDoctor) {
        const createdDoctor = await createDoctorProfile({
          userId: form.userId.trim(),
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          specialty: form.specialty.trim(),
          qualifications: form.qualifications.trim(),
          hospital: form.hospital.trim(),
          consultationFee,
          bio: form.bio.trim(),
          approvalStatus: form.approvalStatus,
        });

        setStoredDoctorProfile(createdDoctor);
        setExistingDoctor(createdDoctor);
        setForm(mapDoctorToForm(createdDoctor));
        setMessage("Doctor profile created successfully.");
      } else {
        const updatedDoctor = await updateDoctorProfile(existingDoctor.doctorId, {
          fullName: form.fullName.trim(),
          specialty: form.specialty.trim(),
          qualifications: form.qualifications.trim(),
          hospital: form.hospital.trim(),
          consultationFee,
          bio: form.bio.trim(),
          approvalStatus: form.approvalStatus,
        });

        setStoredDoctorProfile(updatedDoctor);
        setExistingDoctor(updatedDoctor);
        setForm(mapDoctorToForm(updatedDoctor));
        setMessage("Doctor profile updated successfully.");
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to save doctor profile");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DoctorShell
      title="Professional Profile"
      subtitle="Complete your medical profile to start consulting with patients."
    >
      <div className="card-premium border border-gray-100 p-10">
        {isLoadingProfile ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <Loader2 className="animate-spin text-black" size={40} />
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading doctor profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-10 animate-in fade-in duration-500">
             {/* Form Section Header */}
            <div className="flex items-center justify-between pb-6 border-b border-gray-50">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                     <Stethoscope size={22} />
                  </div>
                  <div>
                     <h3 className="text-lg font-bold uppercase tracking-tight">Credentials & Verification</h3>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Medical registration details</p>
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
                disabled={!!existingDoctor || isSubmitting} 
              />

              <FormField 
                label="Email" 
                icon={Mail} 
                value={form.email} 
                onChange={(e: any) => setForm({ ...form, email: e.target.value })} 
                placeholder="doctor@example.com" 
                required 
                disabled={!!existingDoctor || isSubmitting} 
              />

              <FormField 
                label="Full Name" 
                icon={User} 
                value={form.fullName} 
                onChange={(e: any) => setForm({ ...form, fullName: e.target.value })} 
                placeholder="Dr. Sarah Perera" 
                required 
                disabled={isSubmitting} 
              />

              <FormField 
                label="Specialty" 
                icon={Stethoscope} 
                value={form.specialty} 
                onChange={(e: any) => setForm({ ...form, specialty: e.target.value })} 
                placeholder="General Physician" 
                required 
                disabled={isSubmitting} 
              />

              <FormField 
                label="Qualifications" 
                icon={GraduationCap} 
                value={form.qualifications} 
                onChange={(e: any) => setForm({ ...form, qualifications: e.target.value })} 
                placeholder="MBBS, MD" 
                required 
                disabled={isSubmitting} 
              />

              <FormField 
                label="Hospital" 
                icon={Hospital} 
                value={form.hospital} 
                onChange={(e: any) => setForm({ ...form, hospital: e.target.value })} 
                placeholder="City Hospital" 
                required 
                disabled={isSubmitting} 
              />

              <FormField 
                label="Consultation Fee (LKR)" 
                icon={CreditCard} 
                type="number"
                value={form.consultationFee} 
                onChange={(e: any) => setForm({ ...form, consultationFee: e.target.value })} 
                required 
                disabled={isSubmitting} 
              />

              <FormField 
                label="Approval Status" 
                icon={ShieldCheck} 
                isSelect
                options={[
                  { value: "APPROVED", label: "APPROVED" },
                  { value: "PENDING", label: "PENDING" },
                  { value: "REJECTED", label: "REJECTED" }
                ]}
                value={form.approvalStatus} 
                onChange={(e: any) => setForm({ ...form, approvalStatus: e.target.value as DoctorApprovalStatus })} 
                disabled={isSubmitting} 
              />
            </div>

            <FormField 
              label="Bio" 
              icon={FileText} 
              isTextArea 
              value={form.bio} 
              onChange={(e: any) => setForm({ ...form, bio: e.target.value })} 
              placeholder="Experienced general physician..." 
              required 
              disabled={isSubmitting} 
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-8 pt-8 border-t border-gray-50">
              <div className="flex-1 w-full text-center sm:text-left">
                {existingDoctor && (
                  <div className="inline-flex items-center gap-3 px-5 py-3 bg-gray-50 text-black rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-gray-100 shadow-sm">
                    <Info size={14} className="text-gray-400" />
                    <span>Doctor ID: <code className="bg-white px-2 py-0.5 rounded text-gray-600">{existingDoctor.doctorId}</code></span>
                  </div>
                )}
                
                {error && <p className="mt-4 text-xs font-bold text-black uppercase tracking-widest flex items-center justify-center sm:justify-start gap-3"><span className="w-2 h-2 rounded-full bg-black animate-pulse"></span> {error}</p>}
                {message && <p className="mt-4 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center justify-center sm:justify-start gap-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> 
                    {message}
                </p>}
              </div>

              <button 
                type="submit" 
                className="btn-primary w-full sm:w-auto flex items-center justify-center gap-4 py-5 shadow-2xl shadow-black/10 disabled:opacity-30 disabled:grayscale transition-all" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    <span className="uppercase tracking-widest text-xs">Processing...</span>
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    <span className="uppercase tracking-widest text-xs font-bold">{existingDoctor ? "Save Changes" : "Create Profile"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </DoctorShell>
  );
}