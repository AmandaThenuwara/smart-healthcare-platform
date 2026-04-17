import { useEffect, useState, type CSSProperties } from "react";
import PatientShell from "./PatientShell";
import {
  cancelMyAppointment,
  getAppointmentsByPatient,
} from "../../api/appointmentApi";
import { getStoredPatientProfile } from "../../api/patientApi";
import type { Appointment } from "../../types/appointment";

function sortAppointments(data: Appointment[]) {
  return [...data].sort((a, b) => {
    const first = `${a.date}T${a.timeSlot}`;
    const second = `${b.date}T${b.timeSlot}`;
    return first.localeCompare(second);
  });
}

function canCancel(status: Appointment["status"]) {
  return ["PAYMENT_PENDING", "PENDING", "CONFIRMED"].includes(status);
}

export default function PatientAppointmentsPage() {
  const storedPatient = getStoredPatientProfile();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!storedPatient) {
      setIsLoading(false);
      return;
    }

    void loadAppointments(storedPatient.patientId);
  }, []);

  async function loadAppointments(patientId: string) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getAppointmentsByPatient(patientId);
      setAppointments(sortAppointments(data));
    } catch (error) {
      console.error(error);
      setError("Failed to load patient appointments.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancel(appointmentId: string) {
    if (!window.confirm("Cancel this appointment?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const updated = await cancelMyAppointment(appointmentId);
      setAppointments((prev) =>
        sortAppointments(
          prev.map((item) =>
            item.appointmentId === appointmentId ? updated : item
          )
        )
      );
      setMessage(`Appointment ${appointmentId} cancelled successfully.`);
    } catch (error) {
      console.error(error);
      setError("Failed to cancel appointment.");
    }
  }

  return (
    <PatientShell
      title="My Appointments"
      subtitle="Review your booked appointments, see status history, and cancel allowed appointments."
    >
      {!storedPatient ? (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Patient Profile Needed</h2>
          <p style={textStyle}>
            Please create the patient profile first. This page needs the saved patient profile.
          </p>
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={headerRowStyle}>
            <h2 style={sectionTitleStyle}>Appointments</h2>
            <button
              onClick={() => void loadAppointments(storedPatient.patientId)}
              style={secondaryButtonStyle}
            >
              Refresh
            </button>
          </div>

          {error && <p style={errorStyle}>{error}</p>}
          {message && <p style={successStyle}>{message}</p>}

          {isLoading ? (
            <p style={textStyle}>Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <p style={textStyle}>No appointments found yet.</p>
          ) : (
            <div style={appointmentsWrapperStyle}>
              {appointments.map((appointment) => (
                <div key={appointment.appointmentId} style={appointmentCardStyle}>
                  <div style={appointmentTopStyle}>
                    <div>
                      <h3 style={appointmentTitleStyle}>
                        Appointment #{appointment.appointmentId}
                      </h3>
                      <p style={metaTextStyle}>
                        <strong>Doctor ID:</strong> {appointment.doctorId}
                      </p>
                      <p style={metaTextStyle}>
                        <strong>Date:</strong> {appointment.date}
                      </p>
                      <p style={metaTextStyle}>
                        <strong>Time Slot:</strong> {appointment.timeSlot}
                      </p>
                      <p style={metaTextStyle}>
                        <strong>Consultation Type:</strong> {appointment.consultationType}
                      </p>
                      <p style={metaTextStyle}>
                        <strong>Reason:</strong> {appointment.reason}
                      </p>
                    </div>

                    <div style={statusBoxStyle}>
                      <p style={statusLabelStyle}>Current Status</p>
                      <div style={statusBadgeStyle}>{appointment.status}</div>

                      {canCancel(appointment.status) && (
                        <button
                          onClick={() => void handleCancel(appointment.appointmentId)}
                          style={cancelButtonStyle}
                        >
                          Cancel Appointment
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={historySectionStyle}>
                    <h4 style={historyTitleStyle}>Status History</h4>
                    {appointment.statusHistory.length === 0 ? (
                      <p style={textStyle}>No status history available.</p>
                    ) : (
                      <div style={historyListStyle}>
                        {appointment.statusHistory.map((historyItem, index) => (
                          <div
                            key={`${appointment.appointmentId}-${historyItem.changedAt}-${index}`}
                            style={historyItemStyle}
                          >
                            <div style={historyStatusStyle}>{historyItem.status}</div>
                            <div style={historyDateStyle}>
                              {new Date(historyItem.changedAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
  marginBottom: "14px",
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "#374151",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "14px",
  flexWrap: "wrap",
};

const secondaryButtonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#e5e7eb",
  color: "#111827",
  fontWeight: 600,
  cursor: "pointer",
};

const errorStyle: CSSProperties = {
  marginBottom: "10px",
  color: "#dc2626",
};

const successStyle: CSSProperties = {
  marginBottom: "10px",
  color: "#16a34a",
};

const appointmentsWrapperStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

const appointmentCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "20px",
  background: "#fcfcfd",
};

const appointmentTopStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  flexWrap: "wrap",
};

const appointmentTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
};

const metaTextStyle: CSSProperties = {
  margin: "6px 0",
  color: "#374151",
};

const statusBoxStyle: CSSProperties = {
  minWidth: "220px",
};

const statusLabelStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "8px",
  color: "#6b7280",
  fontSize: "13px",
};

const statusBadgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1e3a8a",
  fontWeight: 700,
};

const cancelButtonStyle: CSSProperties = {
  display: "block",
  marginTop: "12px",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#fee2e2",
  color: "#991b1b",
  fontWeight: 600,
  cursor: "pointer",
};

const historySectionStyle: CSSProperties = {
  marginTop: "18px",
};

const historyTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "10px",
};

const historyListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const historyItemStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  padding: "12px 14px",
  borderRadius: "10px",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  flexWrap: "wrap",
};

const historyStatusStyle: CSSProperties = {
  fontWeight: 700,
  color: "#111827",
};

const historyDateStyle: CSSProperties = {
  color: "#4b5563",
};
