import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useAuth } from "../../context/AuthContext";
import DoctorShell from "./DoctorShell";
import {
  createDoctorProfile,
  getStoredDoctorProfile,
  setStoredDoctorProfile,
  updateDoctorProfile,
} from "../../api/doctorApi";
import type { DoctorApprovalStatus, DoctorProfile } from "../../types/doctor";
import { 
  User, 
  Mail, 
  Stethoscope, 
  GraduationCap, 
  Building2, 
  CreditCard, 
  ShieldCheck, 
  Info, 
  Save, 
  Hash,
  AlertCircle,
  FileText
} from "lucide-react";

type DoctorFormState = {
  userId: string;
  fullName: string;
  email: string;
  specialty: string;
  qualifications: string;
  hospital: string;
  consultationFee: string;
  bio: string;
  approvalStatus: DoctorApprovalStatus | string;
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

export default function DoctorProfilePage() {
  const { user } = useAuth();
  const initialUserId = useMemo(() => extractUserId(user), [user]);

  const [existingDoctor, setExistingDoctor] = useState<DoctorProfile | null>(null);
  const [form, setForm] = useState<DoctorFormState>({
    userId: initialUserId,
    fullName: user?.fullName || "",
    email: user?.email || "",
    specialty: "",
    qualifications: "",
    hospital: "",
    consultationFee: "",
    bio: "",
    approvalStatus: "APPROVED",
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const storedDoctor = getStoredDoctorProfile();

    if (storedDoctor) {
      setExistingDoctor(storedDoctor);
      setForm(mapDoctorToForm(storedDoctor));
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
    if (form.fullName.trim().length < 3) {
      setError("Full name must be at least 3 characters long.");
      return;
    }

    if (form.specialty.trim().length < 3) {
      setError("Please specify a valid medical specialty.");
      return;
    }

    if (form.qualifications.trim().length < 2) {
      setError("Please enter your medical qualifications.");
      return;
    }

    if (form.hospital.trim().length < 3) {
      setError("Please specify your primary hospital or clinic.");
      return;
    }

    const consultationFee = Number(form.consultationFee);
    if (Number.isNaN(consultationFee) || consultationFee < 100) {
      setError("Consultation fee must be a valid amount (minimum 100 LKR).");
      return;
    }

    if (form.bio.trim().length < 20) {
      setError("Professional bio should be at least 20 characters long.");
      return;
    }
    // -------------------

    setIsSubmitting(true);

    try {
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
          approvalStatus: form.approvalStatus as DoctorApprovalStatus,
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
          approvalStatus: form.approvalStatus as DoctorApprovalStatus,
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
      title="Doctor Profile"
      subtitle="Complete your professional profile to start accepting appointments."
    >
      <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-soft border border-slate-100/50">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
            <User size={20} />
          </div>
          <h2 className="text-[17px] font-bold text-slate-800">Professional Information</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">User ID</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Hash size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 font-medium"
                  placeholder="user_001"
                  required
                  disabled={!!existingDoctor || isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Email Address</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Mail size={16} className="text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 font-medium"
                  placeholder="doctor@example.com"
                  required
                  disabled={!!existingDoctor || isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Full Name</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <User size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 font-medium"
                  placeholder="Dr. Sarah Perera"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Medical Specialty</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Stethoscope size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 font-medium"
                  placeholder="General Physician"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Qualifications</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <GraduationCap size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={form.qualifications}
                  onChange={(e) => setForm({ ...form, qualifications: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 font-medium"
                  placeholder="MBBS, MD"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Primary Hospital</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <Building2 size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={form.hospital}
                  onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 font-medium"
                  placeholder="City Hospital"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Consultation Fee (LKR)</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <CreditCard size={16} className="text-slate-400" />
                <input
                  type="number"
                  value={form.consultationFee}
                  onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 font-medium"
                  placeholder="3000"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-bold text-slate-600 ml-1">Approval Status</label>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                <ShieldCheck size={16} className="text-slate-400" />
                <select
                  value={form.approvalStatus}
                  onChange={(e) => setForm({ ...form, approvalStatus: e.target.value })}
                  className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800 font-bold appearance-none cursor-pointer"
                  disabled={isSubmitting}
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-slate-600 ml-1">Professional Bio</label>
            <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 px-4 py-3 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
              <FileText size={18} className="text-slate-400 mt-1" />
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full min-h-[140px] bg-transparent outline-none text-[14px] text-slate-800 resize-y leading-relaxed"
                placeholder="Briefly describe your experience and medical background..."
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {existingDoctor && (
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-50 border border-slate-100 rounded-[15px] text-slate-500 text-[13px] font-medium">
              <Info size={18} className="text-[#0f172a]" />
              <span><strong>System ID:</strong> <code className="bg-white px-2 py-0.5 rounded border border-slate-200">{existingDoctor.doctorId}</code></span>
            </div>
          )}

          <div className="mt-4">
            {error && (
              <div className="flex items-center gap-2 text-rose-500 text-[14px] font-bold mb-4 ml-1 animate-in fade-in duration-300">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {message && (
              <div className="flex items-center gap-2 text-emerald-500 text-[14px] font-bold mb-4 ml-1 animate-in fade-in duration-300">
                <ShieldCheck size={16} />
                <span>{message}</span>
              </div>
            )}
            
            <button 
              type="submit" 
              className="bg-[#0f172a] text-white px-10 py-4 rounded-[15px] font-bold text-[14px] shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
              disabled={isSubmitting}
            >
              <Save size={18} />
              <span>
                {isSubmitting
                  ? "Saving Changes..."
                  : existingDoctor
                    ? "Update Profile"
                    : "Create Profile"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </DoctorShell>
  );
}
