import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import DoctorShell from "./DoctorShell";
import {
  getAvailabilitySlots,
  getStoredDoctorProfile,
} from "../../api/doctorApi";
import { getAppointmentsByDoctor } from "../../api/appointmentApi";

export default function DoctorDashboardPage() {
  const [doctorName, setDoctorName] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [availabilityCount, setAvailabilityCount] = useState<number>(0);
  const [appointmentCount, setAppointmentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const storedDoctor = getStoredDoctorProfile();

      if (!storedDoctor) {
        setIsLoading(false);
        return;
      }

      setDoctorName(storedDoctor.fullName);
      setDoctorId(storedDoctor.doctorId);

      try {
        const [slots, appointments] = await Promise.all([
          getAvailabilitySlots(storedDoctor.doctorId),
          getAppointmentsByDoctor(storedDoctor.doctorId),
        ]);

        setAvailabilityCount(slots.length);
        setAppointmentCount(appointments.length);
      } catch (error) {
        console.error("Failed to load doctor dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboardData();
  }, []);

  return (
    <DoctorShell
      title="Doctor Dashboard"
      subtitle="Manage your profile, maintain your availability, and handle appointment requests."
    >
      {!doctorId ? (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Profile Setup Required</h2>
          <p style={textStyle}>
            No doctor profile is linked in the frontend yet. Create your doctor
            profile first, then availability and appointment pages will use that
            saved doctor record.
          </p>
          <Link to="/doctor/profile" style={primaryLinkStyle}>
            Go to Doctor Profile
          </Link>
        </div>
      ) : (
        <>
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Doctor Name</p>
              <h3 style={statValueStyle}>{doctorName}</h3>
            </div>

            <div style={statCardStyle}>
              <p style={statLabelStyle}>Doctor ID</p>
              <h3 style={statValueStyle}>{doctorId}</h3>
            </div>

            <div style={statCardStyle}>
              <p style={statLabelStyle}>Availability Slots</p>
              <h3 style={statValueStyle}>
                {isLoading ? "Loading..." : availabilityCount}
              </h3>
            </div>

            <div style={statCardStyle}>
              <p style={statLabelStyle}>Appointments</p>
              <h3 style={statValueStyle}>
                {isLoading ? "Loading..." : appointmentCount}
              </h3>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Quick Actions</h2>
            <div style={actionRowStyle}>
              <Link to="/doctor/profile" style={primaryLinkStyle}>
                Manage Profile
              </Link>
              <Link to="/doctor/availability" style={secondaryLinkStyle}>
                Manage Availability
              </Link>
              <Link to="/doctor/appointments" style={secondaryLinkStyle}>
                View Appointments
              </Link>
            </div>
          </div>
        </>
      )}
    </DoctorShell>
  );
}

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
  marginBottom: "20px",
};

const statCardStyle: CSSProperties = {
  background: "white",
  borderRadius: "16px",
  padding: "20px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const statLabelStyle: CSSProperties = {
  margin: 0,
  color: "#6b7280",
  fontSize: "14px",
};

const statValueStyle: CSSProperties = {
  marginTop: "10px",
  marginBottom: 0,
  wordBreak: "break-word",
};

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

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
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

const secondaryLinkStyle: CSSProperties = {
  display: "inline-block",
  textDecoration: "none",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "#e5e7eb",
  color: "#111827",
  fontWeight: 600,
};
