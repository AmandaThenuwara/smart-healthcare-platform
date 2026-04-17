import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { browseApprovedDoctors, getAvailabilitySlots } from "../../api/doctorApi";
import { createAppointment, getAppointmentsByPatient } from "../../api/appointmentApi";
import { getStoredPatientProfile } from "../../api/patientApi";
import type { Appointment } from "../../types/appointment";
import type { AvailabilitySlot, DoctorProfile } from "../../types/doctor";
import PatientShell from "./PatientShell";

export default function PatientBookAppointmentPage() {
  const patientProfile = useMemo(() => getStoredPatientProfile(), []);

  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [hospital, setHospital] = useState("");
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [consultationType, setConsultationType] = useState<"ONLINE" | "PHYSICAL">("ONLINE");
  const [reason, setReason] = useState("");

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadDoctors();
  }, []);

  useEffect(() => {
    if (patientProfile?.patientId) {
      void loadAppointments(patientProfile.patientId);
    }
  }, [patientProfile?.patientId]);

  async function loadDoctors() {
    setIsLoadingDoctors(true);
    setError("");

    try {
      const data = await browseApprovedDoctors({
        search: search || undefined,
        specialty: specialty || undefined,
        hospital: hospital || undefined,
      });
      setDoctors(data);
    } catch (error) {
      console.error(error);
      setError("Failed to load approved doctors.");
    } finally {
      setIsLoadingDoctors(false);
    }
  }

  async function loadSlots(doctor: DoctorProfile) {
    setSelectedDoctor(doctor);
    setSelectedSlotId("");
    setSlots([]);
    setIsLoadingSlots(true);
    setError("");
    setMessage("");

    try {
      const data = await getAvailabilitySlots(doctor.doctorId, true);
      setSlots(data);
    } catch (error) {
      console.error(error);
      setError("Failed to load availability slots.");
    } finally {
      setIsLoadingSlots(false);
    }
  }

  async function loadAppointments(patientId: string) {
    setIsLoadingAppointments(true);

    try {
      const data = await getAppointmentsByPatient(patientId);
      setAppointments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingAppointments(false);
    }
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadDoctors();
  }

  async function handleBookAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!patientProfile) {
      setError("Create your patient profile first.");
      return;
    }

    if (!selectedDoctor) {
      setError("Select a doctor first.");
      return;
    }

    const slot = slots.find((item) => item.slotId === selectedSlotId);
    if (!slot) {
      setError("Select an available slot first.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      await createAppointment({
        patientId: patientProfile.patientId,
        doctorId: selectedDoctor.doctorId,
        date: slot.date,
        timeSlot: slot.startTime,
        reason,
        consultationType,
      });

      setMessage("Appointment booked successfully.");
      setReason("");
      setSelectedSlotId("");

      await loadSlots(selectedDoctor);
      await loadAppointments(patientProfile.patientId);
    } catch (error) {
      console.error(error);
      setError("Failed to book appointment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PatientShell
      title="Book Appointment"
      subtitle="Browse approved doctors, view their available slots, and book a real appointment."
    >
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Find a Doctor</h2>

        <form onSubmit={handleSearchSubmit} style={searchGridStyle}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, specialty, hospital"
            style={inputStyle}
          />
          <input
            type="text"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Filter by specialty"
            style={inputStyle}
          />
          <input
            type="text"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            placeholder="Filter by hospital"
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
            {isLoadingDoctors ? "Loading..." : "Search Doctors"}
          </button>
        </form>

        {error && <p style={errorStyle}>{error}</p>}
        {message && <p style={successStyle}>{message}</p>}

        <div style={doctorListStyle}>
          {doctors.map((doctor) => (
            <div key={doctor.doctorId} style={doctorCardStyle}>
              <h3 style={doctorNameStyle}>{doctor.fullName}</h3>
              <p style={metaStyle}><strong>Specialty:</strong> {doctor.specialty}</p>
              <p style={metaStyle}><strong>Hospital:</strong> {doctor.hospital}</p>
              <p style={metaStyle}><strong>Qualifications:</strong> {doctor.qualifications}</p>
              <p style={metaStyle}><strong>Fee:</strong> LKR {doctor.consultationFee.toFixed(2)}</p>
              <p style={metaStyle}><strong>Bio:</strong> {doctor.bio || "No bio available"}</p>
              <button
                type="button"
                style={buttonStyle}
                onClick={() => void loadSlots(doctor)}
              >
                View Availability
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={sectionTitleStyle}>Availability & Booking</h2>

        {!selectedDoctor ? (
          <p style={emptyTextStyle}>Select a doctor to view availability slots.</p>
        ) : (
          <>
            <p style={metaStyle}>
              <strong>Selected Doctor:</strong> {selectedDoctor.fullName} ({selectedDoctor.specialty})
            </p>

            {isLoadingSlots ? (
              <p style={emptyTextStyle}>Loading slots...</p>
            ) : slots.length === 0 ? (
              <p style={emptyTextStyle}>No available slots found for this doctor.</p>
            ) : (
              <form onSubmit={handleBookAppointment} style={formStyle}>
                <div style={fullWidthStyle}>
                  <label style={labelStyle}>Available Slot</label>
                  <select
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    style={inputStyle}
                    required
                  >
                    <option value="">Select a slot</option>
                    {slots.map((slot) => (
                      <option key={slot.slotId} value={slot.slotId}>
                        {slot.date} | {slot.startTime} - {slot.endTime}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={fullWidthStyle}>
                  <label style={labelStyle}>Consultation Type</label>
                  <select
                    value={consultationType}
                    onChange={(e) =>
                      setConsultationType(e.target.value as "ONLINE" | "PHYSICAL")
                    }
                    style={inputStyle}
                  >
                    <option value="ONLINE">ONLINE</option>
                    <option value="PHYSICAL">PHYSICAL</option>
                  </select>
                </div>

                <div style={fullWidthStyle}>
                  <label style={labelStyle}>Reason</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={textareaStyle}
                    placeholder="Describe why you need this appointment"
                    required
                  />
                </div>

                <button type="submit" style={buttonStyle} disabled={isSubmitting}>
                  {isSubmitting ? "Booking..." : "Book Appointment"}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={sectionTitleStyle}>My Appointments</h2>

        {isLoadingAppointments ? (
          <p style={emptyTextStyle}>Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <p style={emptyTextStyle}>No appointments booked yet.</p>
        ) : (
          <div style={historyListStyle}>
            {appointments.map((appointment) => (
              <div key={appointment.appointmentId} style={historyItemStyle}>
                <p style={metaStyle}><strong>Date:</strong> {appointment.date}</p>
                <p style={metaStyle}><strong>Time:</strong> {appointment.timeSlot}</p>
                <p style={metaStyle}><strong>Consultation:</strong> {appointment.consultationType}</p>
                <p style={metaStyle}><strong>Status:</strong> {appointment.status}</p>
                <p style={metaStyle}><strong>Reason:</strong> {appointment.reason}</p>
              </div>
            ))}
          </div>
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

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "14px",
};

const searchGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
  marginBottom: "20px",
};

const doctorListStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
};

const doctorCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
  background: "#fcfcfd",
};

const doctorNameStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
};

const metaStyle: CSSProperties = {
  margin: "8px 0",
  color: "#374151",
};

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const fullWidthStyle: CSSProperties = {
  width: "100%",
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

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "110px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
  resize: "vertical",
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

const errorStyle: CSSProperties = {
  margin: "0 0 12px 0",
  color: "#dc2626",
};

const successStyle: CSSProperties = {
  margin: "0 0 12px 0",
  color: "#16a34a",
};

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "#6b7280",
};

const historyListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const historyItemStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "16px",
  background: "#fcfcfd",
};
