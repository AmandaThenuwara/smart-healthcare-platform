import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import PatientShell from "./PatientShell";
import { getStoredPatientProfile } from "../../api/patientApi";
import TelemedicineManager from "../../components/telemedicine/TelemedicineManager";

export default function PatientTelemedicinePage() {
  const patient = getStoredPatientProfile();

  return (
    <PatientShell
      title="Telemedicine"
      subtitle="Create, find, update, and join telemedicine sessions as a patient."
    >
      {!patient ? (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Patient Profile Needed</h2>
          <p style={textStyle}>
            Please create the patient profile first so the frontend can prefill
            the patientId for telemedicine sessions.
          </p>
          <Link to="/patient/profile" style={primaryLinkStyle}>
            Go to Patient Profile
          </Link>
        </div>
      ) : (
        <TelemedicineManager initialDoctorId="" initialPatientId={patient.patientId} />
      )}
    </PatientShell>
  );
}

const cardStyle: CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
};

const textStyle: CSSProperties = {
  color: "#374151",
  marginBottom: "16px",
};

const primaryLinkStyle: CSSProperties = {
  display: "inline-block",
  textDecoration: "none",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "#1d4ed8",
  color: "white",
  fontWeight: 600,
};
