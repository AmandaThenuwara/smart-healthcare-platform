import { useMemo, useState, type CSSProperties, type FormEvent } from "react";
import {
  createTelemedicineSession,
  getTelemedicineByAppointment,
  getTelemedicineSession,
  updateTelemedicineStatus,
} from "../../api/telemedicineApi";
import type {
  TelemedicineSession,
  TelemedicineStatus,
} from "../../types/telemedicine";

type TelemedicineManagerProps = {
  initialDoctorId: string;
  initialPatientId: string;
};

const TELEMEDICINE_STATUSES: TelemedicineStatus[] = [
  "SCHEDULED",
  "STARTED",
  "ENDED",
];

export default function TelemedicineManager({
  initialDoctorId,
  initialPatientId,
}: TelemedicineManagerProps) {
  const defaultMeetingUrl = useMemo(() => "", []);

  const [form, setForm] = useState({
    appointmentId: "",
    doctorId: initialDoctorId,
    patientId: initialPatientId,
    roomName: "",
    meetingUrl: defaultMeetingUrl,
  });

  const [appointmentLookupId, setAppointmentLookupId] = useState("");
  const [sessionLookupId, setSessionLookupId] = useState("");
  const [currentSession, setCurrentSession] = useState<TelemedicineSession | null>(
    null
  );
  const [statusSelection, setStatusSelection] =
    useState<TelemedicineStatus>("SCHEDULED");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsBusy(true);

    try {
      const roomName = form.roomName.trim();
      const meetingUrl =
        form.meetingUrl.trim() || `https://meet.jit.si/${roomName}`;

      const created = await createTelemedicineSession({
        appointmentId: form.appointmentId.trim(),
        doctorId: form.doctorId.trim(),
        patientId: form.patientId.trim(),
        provider: "JITSI",
        roomName,
        meetingUrl,
        status: "SCHEDULED",
      });

      setCurrentSession(created);
      setStatusSelection(created.status);
      setAppointmentLookupId(created.appointmentId);
      setSessionLookupId(created.sessionId);
      setMessage("Telemedicine session created successfully.");
    } catch (error: any) {
      console.error(error);
      const detail = error.response?.data?.detail;
      setError(detail || "Failed to create telemedicine session");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLookupByAppointment() {
    if (!appointmentLookupId.trim()) {
      setError("Enter an appointment ID first.");
      return;
    }

    setError("");
    setMessage("");
    setIsBusy(true);

    try {
      const session = await getTelemedicineByAppointment(appointmentLookupId.trim());
      setCurrentSession(session);
      setStatusSelection(session.status);
      setMessage("Telemedicine session loaded by appointment ID.");
    } catch (error: any) {
      console.error(error);
      const detail = error.response?.data?.detail;
      setError(detail || "Failed to load telemedicine session by appointment ID");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLookupBySession() {
    if (!sessionLookupId.trim()) {
      setError("Enter a session ID first.");
      return;
    }

    setError("");
    setMessage("");
    setIsBusy(true);

    try {
      const session = await getTelemedicineSession(sessionLookupId.trim());
      setCurrentSession(session);
      setStatusSelection(session.status);
      setMessage("Telemedicine session loaded by session ID.");
    } catch (error: any) {
      console.error(error);
      const detail = error.response?.data?.detail;
      setError(detail || "Failed to load telemedicine session by session ID");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleStatusUpdate() {
    if (!currentSession) {
      setError("Load or create a telemedicine session first.");
      return;
    }

    setError("");
    setMessage("");
    setIsBusy(true);

    try {
      const updated = await updateTelemedicineStatus(
        currentSession.sessionId,
        statusSelection
      );
      setCurrentSession(updated);
      setMessage(`Telemedicine session updated to ${updated.status}.`);
    } catch (error: any) {
      console.error(error);
      const detail = error.response?.data?.detail;
      setError(detail || "Failed to update telemedicine session status");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <>
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Create Telemedicine Session</h2>

        <form onSubmit={handleCreate} style={formGridStyle}>
          <div>
            <label style={labelStyle}>Appointment ID</label>
            <input
              type="text"
              value={form.appointmentId}
              onChange={(e) => setForm({ ...form, appointmentId: e.target.value })}
              style={inputStyle}
              placeholder="67f323abc456def789003333"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Doctor ID</label>
            <input
              type="text"
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              style={inputStyle}
              placeholder="67f123abc456def789001234"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Patient ID</label>
            <input
              type="text"
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              style={inputStyle}
              placeholder="67f423abc456def789004444"
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Room Name</label>
            <input
              type="text"
              value={form.roomName}
              onChange={(e) => setForm({ ...form, roomName: e.target.value })}
              style={inputStyle}
              placeholder="consult-room-001"
              required
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Meeting URL</label>
            <input
              type="text"
              value={form.meetingUrl}
              onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })}
              style={inputStyle}
              placeholder="Leave blank to auto-generate from room name"
            />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            {error && <p style={errorStyle}>{error}</p>}
            {message && <p style={successStyle}>{message}</p>}
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" style={buttonStyle} disabled={isBusy}>
              {isBusy ? "Processing..." : "Create Session"}
            </button>
          </div>
        </form>
      </div>

      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={sectionTitleStyle}>Find Existing Session</h2>

        <div style={lookupGridStyle}>
          <div>
            <label style={labelStyle}>Lookup by Appointment ID</label>
            <input
              type="text"
              value={appointmentLookupId}
              onChange={(e) => setAppointmentLookupId(e.target.value)}
              style={inputStyle}
              placeholder="67f323abc456def789003333"
            />
            <button
              onClick={() => void handleLookupByAppointment()}
              style={secondaryButtonStyle}
              disabled={isBusy}
            >
              Load by Appointment
            </button>
          </div>

          <div>
            <label style={labelStyle}>Lookup by Session ID</label>
            <input
              type="text"
              value={sessionLookupId}
              onChange={(e) => setSessionLookupId(e.target.value)}
              style={inputStyle}
              placeholder="67f723abc456def789007777"
            />
            <button
              onClick={() => void handleLookupBySession()}
              style={secondaryButtonStyle}
              disabled={isBusy}
            >
              Load by Session
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={sectionTitleStyle}>Current Session</h2>

        {!currentSession ? (
          <p style={textStyle}>No telemedicine session loaded yet.</p>
        ) : (
          <>
            <div style={detailsGridStyle}>
              <div style={detailCardStyle}>
                <p style={metaTextStyle}>
                  <strong>Session ID:</strong> {currentSession.sessionId}
                </p>
                <p style={metaTextStyle}>
                  <strong>Appointment ID:</strong> {currentSession.appointmentId}
                </p>
                <p style={metaTextStyle}>
                  <strong>Doctor ID:</strong> {currentSession.doctorId}
                </p>
                <p style={metaTextStyle}>
                  <strong>Patient ID:</strong> {currentSession.patientId}
                </p>
                <p style={metaTextStyle}>
                  <strong>Provider:</strong> {currentSession.provider}
                </p>
                <p style={metaTextStyle}>
                  <strong>Room Name:</strong> {currentSession.roomName}
                </p>
                <p style={metaTextStyle}>
                  <strong>Created At:</strong>{" "}
                  {new Date(currentSession.createdAt).toLocaleString()}
                </p>
              </div>

              <div style={detailCardStyle}>
                <p style={metaTextStyle}>
                  <strong>Status:</strong> {currentSession.status}
                </p>
                <p style={metaTextStyle}>
                  <strong>Meeting URL:</strong>
                </p>
                <a
                  href={currentSession.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={meetingLinkStyle}
                >
                  Open Meeting
                </a>

                <div style={{ marginTop: "18px" }}>
                  <label style={labelStyle}>Update Status</label>
                  <select
                    value={statusSelection}
                    onChange={(e) =>
                      setStatusSelection(e.target.value as TelemedicineStatus)
                    }
                    style={selectStyle}
                  >
                    {TELEMEDICINE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => void handleStatusUpdate()}
                    style={{ ...buttonStyle, marginTop: "12px" }}
                    disabled={isBusy}
                  >
                    Update Session Status
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
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

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const lookupGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "16px",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "8px",
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
};

const selectStyle: CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
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

const secondaryButtonStyle: CSSProperties = {
  marginTop: "12px",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#e5e7eb",
  color: "#111827",
  fontWeight: 600,
  cursor: "pointer",
};

const errorStyle: CSSProperties = {
  margin: 0,
  color: "#dc2626",
};

const successStyle: CSSProperties = {
  margin: 0,
  color: "#16a34a",
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "#374151",
};

const detailsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
};

const detailCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
  background: "#fcfcfd",
};

const metaTextStyle: CSSProperties = {
  margin: "6px 0",
  color: "#374151",
};

const meetingLinkStyle: CSSProperties = {
  display: "inline-block",
  marginTop: "4px",
  textDecoration: "none",
  color: "#1d4ed8",
  fontWeight: 700,
};
