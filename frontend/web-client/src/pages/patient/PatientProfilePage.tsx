import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
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
      title="Patient Profile"
      subtitle="Your saved patient profile is loaded from the backend whenever you log in."
    >
      <div style={cardStyle}>
        {isLoadingProfile ? (
          <p style={infoTextStyle}>Loading patient profile...</p>
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
                  disabled={!!existingPatient || isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  style={inputStyle}
                  placeholder="patient@example.com"
                  required
                  disabled={!!existingPatient || isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  style={inputStyle}
                  placeholder="John Doe"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  style={inputStyle}
                  placeholder="0771234567"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) =>
                    setForm({ ...form, dateOfBirth: e.target.value })
                  }
                  style={inputStyle}
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Gender</label>
                <input
                  type="text"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  style={inputStyle}
                  placeholder="Male"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Emergency Contact Name</label>
                <input
                  type="text"
                  value={form.emergencyContactName}
                  onChange={(e) =>
                    setForm({ ...form, emergencyContactName: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="Jane Doe"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label style={labelStyle}>Emergency Contact Phone</label>
                <input
                  type="text"
                  value={form.emergencyContactPhone}
                  onChange={(e) =>
                    setForm({ ...form, emergencyContactPhone: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="0777654321"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <label style={labelStyle}>Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={textareaStyle}
                placeholder="123 Main Street, Colombo"
                required
                disabled={isSubmitting}
              />
            </div>

            {existingPatient && (
              <div style={infoBoxStyle}>
                <strong>Current patientId:</strong> {existingPatient.patientId}
              </div>
            )}

            {error && <p style={errorStyle}>{error}</p>}
            {message && <p style={successStyle}>{message}</p>}

            <button type="submit" style={buttonStyle} disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : existingPatient
                ? "Update Patient Profile"
                : "Create Patient Profile"}
            </button>
          </form>
        )}
      </div>
    </PatientShell>
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