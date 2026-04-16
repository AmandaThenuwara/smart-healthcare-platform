import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import DoctorShell from "./DoctorShell";
import { getStoredDoctorProfile } from "../../api/doctorApi";
import {
  getAppointmentsByDoctor,
  updateAppointmentStatus,
} from "../../api/appointmentApi";
import type { Appointment, AppointmentStatus } from "../../types/appointment";

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "REJECTED",
  "RESCHEDULED",
  "CANCELLED",
  "COMPLETED",
];

function sortAppointments(data: Appointment[]) {
  return [...data].sort((a, b) => {
    const first = `${a.date}T${a.timeSlot}`;
    const second = `${b.date}T${b.timeSlot}`;
    return first.localeCompare(second);
  });
}

export default function DoctorAppointmentsPage() {
  const [doctorId, setDoctorId] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pendingStatuses, setPendingStatuses] = useState<
    Record<string, AppointmentStatus>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedDoctor = getStoredDoctorProfile();

    if (!storedDoctor) {
      setIsLoading(false);
      return;
    }

    setDoctorId(storedDoctor.doctorId);
    void loadAppointments(storedDoctor.doctorId);
  }, []);

  async function loadAppointments(currentDoctorId: string) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getAppointmentsByDoctor(currentDoctorId);
      const sorted = sortAppointments(data);
      setAppointments(sorted);

      const nextStatuses: Record<string, AppointmentStatus> = {};
      sorted.forEach((appointment) => {
        nextStatuses[appointment.appointmentId] = appointment.status;
      });
      setPendingStatuses(nextStatuses);
    } catch (error) {
      console.error(error);
      setError("Failed to load doctor appointments");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(appointmentId: string) {
    const nextStatus = pendingStatuses[appointmentId];

    if (!nextStatus) return;

    setError("");
    setMessage("");

    try {
      const updated = await updateAppointmentStatus(appointmentId, nextStatus);

      setAppointments((prev) =>
        sortAppointments(
          prev.map((appointment) =>
            appointment.appointmentId === appointmentId ? updated : appointment
          )
        )
      );

      setPendingStatuses((prev) => ({
        ...prev,
        [appointmentId]: updated.status,
      }));

      setMessage(`Appointment ${appointmentId} updated to ${updated.status}.`);
    } catch (error) {
      console.error(error);
      setError(`Failed to update appointment ${appointmentId}`);
    }
  }

  return (
    <DoctorShell
      title="Doctor Appointments"
      subtitle="Track appointments, view status history, and update the current status."
    >
      {!doctorId ? (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Doctor Profile Needed</h2>
          <p style={textStyle}>
            Please create the doctor profile first so the frontend knows which
            doctor appointments to load.
          </p>
          <Link to="/doctor/profile" style={linkButtonStyle}>
            Go to Doctor Profile
          </Link>
        </div>
      ) : (
        <div style={cardStyle}>
          <div style={headerRowStyle}>
            <h2 style={sectionTitleStyle}>Appointments</h2>
            <button onClick={() => void loadAppointments(doctorId)} style={secondaryButtonStyle}>
              Refresh
            </button>
          </div>

          {error && <p style={errorStyle}>{error}</p>}
          {message && <p style={successStyle}>{message}</p>}

          {isLoading ? (
            <p style={textStyle}>Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <p style={textStyle}>No appointments found for this doctor.</p>
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
                        <strong>Patient ID:</strong> {appointment.patientId}
                      </p>
                      <p style={metaTextStyle}>
                        <strong>Date:</strong> {appointment.date}
                      </p>
                      <p style={metaTextStyle}>
                        <strong>Time Slot:</strong> {appointment.timeSlot}
                      </p>
                      <p style={metaTextStyle}>
                        <strong>Consultation Type:</strong>{" "}
                        {appointment.consultationType}
                      </p>
                      <p style={metaTextStyle}>
                        <strong>Reason:</strong> {appointment.reason}
                      </p>
                    </div>

                    <div style={statusBoxStyle}>
                      <p style={statusLabelStyle}>Current Status</p>
                      <div style={statusBadgeStyle}>{appointment.status}</div>
                    </div>
                  </div>

                  <div style={updateRowStyle}>
                    <select
                      value={
                        pendingStatuses[appointment.appointmentId] || appointment.status
                      }
                      onChange={(e) =>
                        setPendingStatuses((prev) => ({
                          ...prev,
                          [appointment.appointmentId]:
                            e.target.value as AppointmentStatus,
                        }))
                      }
                      style={selectStyle}
                    >
                      {APPOINTMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => void handleStatusUpdate(appointment.appointmentId)}
                      style={buttonStyle}
                    >
                      Update Status
                    </button>
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
  marginBottom: "14px",
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "#374151",
};

const linkButtonStyle: CSSProperties = {
  display: "inline-block",
  marginTop: "16px",
  textDecoration: "none",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "#1d4ed8",
  color: "white",
  fontWeight: 600,
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
  minWidth: "180px",
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

const updateRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  marginTop: "18px",
  flexWrap: "wrap",
};

const selectStyle: CSSProperties = {
  minWidth: "220px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
};

const buttonStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#1d4ed8",
  color: "white",
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
