import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
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
      title="Doctor Profile"
      subtitle="Your saved doctor profile is loaded from the backend whenever you log in."
    >
      <div style={cardStyle}>
        {isLoadingProfile ? (
          <p style={infoTextStyle}>Loading doctor profile...</p>
        ) : (
          <form onSubmit={handleSubmit} style={formStyle}>
            <div style={twoColumnGridStyle}>
              <div>
                <label style={labelStyle}>User ID</label>
                <input
                  type="text"
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  style={inputStyle}
                  placeholder="user_001"
                  required
                  disabled={!!existingDoctor || isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                  placeholder="doctor@example.com"
                  required
                  disabled={!!existingDoctor || isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  style={inputStyle}
                  placeholder="Dr. Sarah Perera"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Specialty</label>
                <input
                  type="text"
                  value={form.specialty}
                  onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                  style={inputStyle}
                  placeholder="General Physician"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Qualifications</label>
                <input
                  type="text"
                  value={form.qualifications}
                  onChange={(e) =>
                    setForm({ ...form, qualifications: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="MBBS, MD"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Hospital</label>
                <input
                  type="text"
                  value={form.hospital}
                  onChange={(e) => setForm({ ...form, hospital: e.target.value })}
                  style={inputStyle}
                  placeholder="City Hospital"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Consultation Fee</label>
                <input
                  type="number"
                  value={form.consultationFee}
                  onChange={(e) =>
                    setForm({ ...form, consultationFee: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="3000"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Approval Status</label>
                <select
                  value={form.approvalStatus}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      approvalStatus: e.target.value as DoctorApprovalStatus,
                    })
                  }
                  style={inputStyle}
                  disabled={isSubmitting}
                >
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <label style={labelStyle}>Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                style={textareaStyle}
                placeholder="Experienced general physician"
                required
                disabled={isSubmitting}
              />
            </div>

            {existingDoctor && (
              <div style={infoBoxStyle}>
                <strong>Current doctorId:</strong> {existingDoctor.doctorId}
              </div>
            )}

            {error && <p style={errorStyle}>{error}</p>}
            {message && <p style={successStyle}>{message}</p>}

            <button type="submit" style={buttonStyle} disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : existingDoctor
                ? "Update Doctor Profile"
                : "Create Doctor Profile"}
            </button>
          </form>
        )}
      </div>
    </DoctorShell>
  );
}

const cardStyle: CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const twoColumnGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 600,
  color: "#111827",
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  boxSizing: "border-box",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "120px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  fontSize: "14px",
  resize: "vertical",
  boxSizing: "border-box",
};

const buttonStyle: CSSProperties = {
  marginTop: "18px",
  padding: "12px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#1d4ed8",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  alignSelf: "flex-start",
};

const infoBoxStyle: CSSProperties = {
  marginTop: "16px",
  padding: "12px 14px",
  background: "#eff6ff",
  color: "#1e3a8a",
  borderRadius: "10px",
};

const infoTextStyle: CSSProperties = {
  margin: 0,
  color: "#374151",
};

const errorStyle: CSSProperties = {
  marginTop: "16px",
  marginBottom: 0,
  color: "#dc2626",
};

const successStyle: CSSProperties = {
  marginTop: "16px",
  marginBottom: 0,
  color: "#16a34a",
};