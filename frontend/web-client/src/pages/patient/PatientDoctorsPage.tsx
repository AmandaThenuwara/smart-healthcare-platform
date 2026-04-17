import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import PatientShell from "./PatientShell";
import { createAppointment } from "../../api/appointmentApi";
import { browseApprovedDoctors, getAvailabilitySlots } from "../../api/doctorApi";
import { getStoredPatientProfile } from "../../api/patientApi";
import type { AvailabilitySlot, DoctorBrowseItem } from "../../types/doctor";

function sortDoctors(data: DoctorBrowseItem[]) {
  return [...data].sort((a, b) => {
    const first = `${a.fullName}-${a.specialty}-${a.hospital}`.toLowerCase();
    const second = `${b.fullName}-${b.specialty}-${b.hospital}`.toLowerCase();
    return first.localeCompare(second);
  });
}

function sortSlots(slots: AvailabilitySlot[]) {
  return [...slots].sort((a, b) => {
    const first = `${a.date}T${a.startTime}`;
    const second = `${b.date}T${b.startTime}`;
    return first.localeCompare(second);
  });
}

export default function PatientDoctorsPage() {
  const storedPatient = useMemo(() => getStoredPatientProfile(), []);
  const [filters, setFilters] = useState({
    search: "",
    specialty: "",
    hospital: "",
  });

  const [doctors, setDoctors] = useState<DoctorBrowseItem[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorBrowseItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  const [consultationType, setConsultationType] = useState<"ONLINE" | "PHYSICAL">("ONLINE");
  const [reason, setReason] = useState("");

  const [isLoadingDoctors, setIsLoadingDoctors] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadDoctors();
  }, []);

  async function loadDoctors() {
    setIsLoadingDoctors(true);
    setError("");

    try {
      const data = await browseApprovedDoctors({
        search: filters.search || undefined,
        specialty: filters.specialty || undefined,
        hospital: filters.hospital || undefined,
      });
      setDoctors(sortDoctors(data));

      if (selectedDoctor) {
        const stillExists = data.find((item) => item.doctorId === selectedDoctor.doctorId);
        if (!stillExists) {
          setSelectedDoctor(null);
          setSelectedSlot(null);
          setSlots([]);
        }
      }
    } catch (error) {
      console.error(error);
      setError("Failed to load approved doctors.");
    } finally {
      setIsLoadingDoctors(false);
    }
  }

  async function loadDoctorSlots(doctor: DoctorBrowseItem) {
    setSelectedDoctor(doctor);
    setSelectedSlot(null);
    setIsLoadingSlots(true);
    setError("");
    setMessage("");

    try {
      const data = await getAvailabilitySlots(doctor.doctorId, true);
      setSlots(sortSlots(data));
    } catch (error) {
      console.error(error);
      setError("Failed to load available slots for the selected doctor.");
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadDoctors();
  }

  async function handleBook() {
    if (!storedPatient) {
      setError("Create the patient profile first.");
      return;
    }

    if (!selectedDoctor || !selectedSlot) {
      setError("Select a doctor and a slot first.");
      return;
    }

    if (!reason.trim()) {
      setError("Enter the appointment reason before booking.");
      return;
    }

    setIsBooking(true);
    setError("");
    setMessage("");

    try {
      const created = await createAppointment({
        patientId: storedPatient.patientId,
        doctorId: selectedDoctor.doctorId,
        date: selectedSlot.date,
        timeSlot: selectedSlot.startTime,
        reason: reason.trim(),
        consultationType,
      });

      setMessage(
        `Appointment booked successfully. Current status: ${created.status}.`
      );
      setReason("");
      setSelectedSlot(null);
      await loadDoctorSlots(selectedDoctor);
    } catch (error) {
      console.error(error);
      setError("Failed to book appointment.");
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <PatientShell
      title="Browse Doctors"
      subtitle="Search approved doctors, view their details, inspect available slots, and book an appointment."
    >
      {!storedPatient ? (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Patient Profile Needed</h2>
          <p style={textStyle}>
            Please create the patient profile first. Booking uses your saved patient
            profile from the frontend.
          </p>
        </div>
      ) : (
        <>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Search Approved Doctors</h2>

            <form onSubmit={handleSearch} style={searchGridStyle}>
              <div>
                <label style={labelStyle}>Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  style={inputStyle}
                  placeholder="Name, specialty, hospital"
                />
              </div>

              <div>
                <label style={labelStyle}>Specialty</label>
                <input
                  type="text"
                  value={filters.specialty}
                  onChange={(e) => setFilters({ ...filters, specialty: e.target.value })}
                  style={inputStyle}
                  placeholder="Cardiology"
                />
              </div>

              <div>
                <label style={labelStyle}>Hospital</label>
                <input
                  type="text"
                  value={filters.hospital}
                  onChange={(e) => setFilters({ ...filters, hospital: e.target.value })}
                  style={inputStyle}
                  placeholder="City Hospital"
                />
              </div>

              <div style={buttonWrapStyle}>
                <button type="submit" style={primaryButtonStyle}>
                  Search Doctors
                </button>
              </div>
            </form>
          </div>

          {error && <p style={errorStyle}>{error}</p>}
          {message && <p style={successStyle}>{message}</p>}

          <div style={twoColumnLayoutStyle}>
            <div style={cardStyle}>
              <div style={headerRowStyle}>
                <h2 style={sectionTitleStyle}>Doctors</h2>
                <button onClick={() => void loadDoctors()} style={secondaryButtonStyle}>
                  Refresh
                </button>
              </div>

              {isLoadingDoctors ? (
                <p style={textStyle}>Loading doctors...</p>
              ) : doctors.length === 0 ? (
                <p style={textStyle}>No approved doctors found for the given filters.</p>
              ) : (
                <div style={listStyle}>
                  {doctors.map((doctor) => (
                    <div key={doctor.doctorId} style={doctorCardStyle}>
                      <h3 style={doctorTitleStyle}>{doctor.fullName}</h3>
                      <p style={metaTextStyle}>
                        <strong>Specialty:</strong> {doctor.specialty}
                      </p>
                      <p style={metaTextStyle}>
                        <strong>Hospital:</strong> {doctor.hospital}
                      </p>
                      <p style={metaTextStyle}>
                        <strong>Qualifications:</strong> {doctor.qualifications}
                      </p>
                      <p style={metaTextStyle}>
                        <strong>Consultation Fee:</strong> LKR {doctor.consultationFee.toFixed(2)}
                      </p>
                      <p style={metaTextStyle}>
                        <strong>Bio:</strong> {doctor.bio || "No bio provided"}
                      </p>

                      <button
                        onClick={() => void loadDoctorSlots(doctor)}
                        style={primaryButtonStyle}
                      >
                        View Available Slots
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h2 style={sectionTitleStyle}>Selected Doctor & Booking</h2>

              {!selectedDoctor ? (
                <p style={textStyle}>
                  Select a doctor from the list to see available slots and book an appointment.
                </p>
              ) : (
                <>
                  <div style={selectedDoctorBoxStyle}>
                    <h3 style={doctorTitleStyle}>{selectedDoctor.fullName}</h3>
                    <p style={metaTextStyle}>
                      <strong>Specialty:</strong> {selectedDoctor.specialty}
                    </p>
                    <p style={metaTextStyle}>
                      <strong>Hospital:</strong> {selectedDoctor.hospital}
                    </p>
                    <p style={metaTextStyle}>
                      <strong>Fee:</strong> LKR {selectedDoctor.consultationFee.toFixed(2)}
                    </p>
                  </div>

                  <div style={{ marginTop: "18px" }}>
                    <h3 style={subHeadingStyle}>Available Slots</h3>

                    {isLoadingSlots ? (
                      <p style={textStyle}>Loading slots...</p>
                    ) : slots.length === 0 ? (
                      <p style={textStyle}>No currently available slots for this doctor.</p>
                    ) : (
                      <div style={slotListStyle}>
                        {slots.map((slot) => {
                          const isSelected = selectedSlot?.slotId === slot.slotId;
                          return (
                            <button
                              key={slot.slotId}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              style={isSelected ? selectedSlotButtonStyle : slotButtonStyle}
                            >
                              {slot.date} | {slot.startTime} - {slot.endTime}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <h3 style={subHeadingStyle}>Book Selected Slot</h3>

                    <div style={bookingGridStyle}>
                      <div>
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

                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={labelStyle}>Reason</label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          style={textareaStyle}
                          placeholder="Describe the reason for your appointment"
                        />
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <p style={metaTextStyle}>
                          <strong>Selected Slot:</strong>{" "}
                          {selectedSlot
                            ? `${selectedSlot.date} | ${selectedSlot.startTime} - ${selectedSlot.endTime}`
                            : "None selected"}
                        </p>
                      </div>

                      <div style={{ gridColumn: "1 / -1" }}>
                        <button
                          type="button"
                          onClick={() => void handleBook()}
                          style={primaryButtonStyle}
                          disabled={isBooking}
                        >
                          {isBooking ? "Booking..." : "Book Appointment"}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
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

const subHeadingStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
};

const textStyle: CSSProperties = {
  margin: 0,
  color: "#374151",
};

const errorStyle: CSSProperties = {
  color: "#dc2626",
  marginTop: "16px",
  marginBottom: 0,
};

const successStyle: CSSProperties = {
  color: "#16a34a",
  marginTop: "16px",
  marginBottom: 0,
};

const searchGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const bookingGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
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

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "100px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
  resize: "vertical",
};

const buttonWrapStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
};

const primaryButtonStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#1d4ed8",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
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

const twoColumnLayoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(320px, 1fr) minmax(360px, 1fr)",
  gap: "20px",
  marginTop: "20px",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "14px",
  flexWrap: "wrap",
};

const listStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const doctorCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
  background: "#fcfcfd",
};

const doctorTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "10px",
};

const metaTextStyle: CSSProperties = {
  margin: "6px 0",
  color: "#374151",
};

const selectedDoctorBoxStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
  background: "#fcfcfd",
};

const slotListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const slotButtonStyle: CSSProperties = {
  padding: "12px 14px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  background: "white",
  cursor: "pointer",
  textAlign: "left",
};

const selectedSlotButtonStyle: CSSProperties = {
  ...slotButtonStyle,
  border: "1px solid #1d4ed8",
  background: "#dbeafe",
  color: "#1e3a8a",
  fontWeight: 700,
};
