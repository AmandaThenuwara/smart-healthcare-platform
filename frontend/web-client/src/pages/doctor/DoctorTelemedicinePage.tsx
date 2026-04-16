import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import DoctorShell from "./DoctorShell";
import { getStoredDoctorProfile } from "../../api/doctorApi";
import TelemedicineManager from "../../components/telemedicine/TelemedicineManager";

export default function DoctorTelemedicinePage() {
  const doctor = getStoredDoctorProfile();

  return (
    <DoctorShell
      title="Telemedicine"
      subtitle="Create, find, update, and join telemedicine sessions as a doctor."
    >
      {!doctor ? (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Doctor Profile Needed</h2>
          <p style={textStyle}>
            Please create the doctor profile first so the frontend can prefill
            the doctorId for telemedicine sessions.
          </p>
          <Link to="/doctor/profile" style={primaryLinkStyle}>
            Go to Doctor Profile
          </Link>
        </div>
      ) : (
        <TelemedicineManager initialDoctorId={doctor.doctorId} initialPatientId="" />
      )}
    </DoctorShell>
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
