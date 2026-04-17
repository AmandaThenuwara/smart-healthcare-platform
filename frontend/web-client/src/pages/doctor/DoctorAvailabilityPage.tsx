import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "react-router-dom";
import DoctorShell from "./DoctorShell";
import {
  createAvailabilitySlot,
  deleteAvailabilitySlot,
  getAvailabilitySlots,
  getStoredDoctorProfile,
  updateAvailabilitySlot,
} from "../../api/doctorApi";
import type { AvailabilitySlot } from "../../types/doctor";

function sortSlots(slots: AvailabilitySlot[]) {
  return [...slots].sort((a, b) => {
    const first = `${a.date}T${a.startTime}`;
    const second = `${b.date}T${b.startTime}`;
    return first.localeCompare(second);
  });
}

export default function DoctorAvailabilityPage() {
  const [doctorId, setDoctorId] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    date: "",
    startTime: "09:00",
    endTime: "10:00",
    isAvailable: true,
  });

  useEffect(() => {
    const storedDoctor = getStoredDoctorProfile();

    if (!storedDoctor) {
      setIsLoading(false);
      return;
    }

    setDoctorId(storedDoctor.doctorId);
    void loadSlots(storedDoctor.doctorId);
  }, []);

  async function loadSlots(currentDoctorId: string) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getAvailabilitySlots(currentDoctorId);
      setSlots(sortSlots(data));
    } catch (error) {
      console.error(error);
      setError("Failed to load availability slots");
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setEditingSlotId(null);
    setForm({
      date: "",
      startTime: "09:00",
      endTime: "10:00",
      isAvailable: true,
    });
  }

  function handleEdit(slot: AvailabilitySlot) {
    setEditingSlotId(slot.slotId);
    setForm({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
    });
    setMessage("");
    setError("");
  }

  async function handleDelete(slotId: string) {
    if (!window.confirm("Delete this availability slot?")) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await deleteAvailabilitySlot(slotId);
      setMessage("Availability slot deleted successfully.");
      if (editingSlotId === slotId) {
        resetForm();
      }
      await loadSlots(doctorId);
    } catch (error) {
      console.error(error);
      setError("Failed to delete availability slot");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!doctorId) {
      setError("Create the doctor profile first.");
      return;
    }

    if (form.startTime >= form.endTime) {
      setError("End time must be later than start time.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingSlotId) {
        await updateAvailabilitySlot(editingSlotId, {
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          isAvailable: form.isAvailable,
        });
        setMessage("Availability slot updated successfully.");
      } else {
        await createAvailabilitySlot({
          doctorId,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          isAvailable: form.isAvailable,
        });
        setMessage("Availability slot created successfully.");
      }

      resetForm();
      await loadSlots(doctorId);
    } catch (error) {
      console.error(error);
      setError(
        editingSlotId
          ? "Failed to update availability slot"
          : "Failed to create availability slot"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <DoctorShell
      title="Doctor Availability"
      subtitle="Create, edit, and delete consultation slots. Overlapping slots are blocked by the backend."
    >
      {!doctorId ? (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Doctor Profile Needed</h2>
          <p style={textStyle}>
            Please create the doctor profile first so the frontend has a saved
            doctorId to use.
          </p>
          <Link to="/doctor/profile" style={linkButtonStyle}>
            Go to Doctor Profile
          </Link>
        </div>
      ) : (
        <>
          <div style={cardStyle}>
            <div style={headerRowStyle}>
              <h2 style={sectionTitleStyle}>
                {editingSlotId ? "Edit Availability Slot" : "Create Availability Slot"}
              </h2>

              {editingSlotId && (
                <button onClick={resetForm} style={secondaryButtonStyle} type="button">
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} style={formGridStyle}>
              <div>
                <label style={labelStyle}>Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Start Time</label>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm({ ...form, startTime: e.target.value })
                  }
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>End Time</label>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Availability</label>
                <select
                  value={String(form.isAvailable)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      isAvailable: e.target.value === "true",
                    })
                  }
                  style={inputStyle}
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                {error && <p style={errorStyle}>{error}</p>}
                {message && <p style={successStyle}>{message}</p>}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <button type="submit" style={buttonStyle} disabled={isSaving}>
                  {isSaving
                    ? "Saving..."
                    : editingSlotId
                    ? "Update Availability Slot"
                    : "Add Availability Slot"}
                </button>
              </div>
            </form>
          </div>

          <div style={{ ...cardStyle, marginTop: "20px" }}>
            <div style={headerRowStyle}>
              <h2 style={sectionTitleStyle}>Existing Slots</h2>
              <button onClick={() => void loadSlots(doctorId)} style={secondaryButtonStyle}>
                Refresh
              </button>
            </div>

            {isLoading ? (
              <p style={textStyle}>Loading slots...</p>
            ) : slots.length === 0 ? (
              <p style={textStyle}>No availability slots found yet.</p>
            ) : (
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Start</th>
                      <th style={thStyle}>End</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slots.map((slot) => (
                      <tr key={slot.slotId}>
                        <td style={tdStyle}>{slot.date}</td>
                        <td style={tdStyle}>{slot.startTime}</td>
                        <td style={tdStyle}>{slot.endTime}</td>
                        <td style={tdStyle}>
                          {slot.isAvailable ? "Available" : "Unavailable"}
                        </td>
                        <td style={tdStyle}>
                          <div style={actionCellStyle}>
                            <button
                              type="button"
                              style={editButtonStyle}
                              onClick={() => handleEdit(slot)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              style={deleteButtonStyle}
                              onClick={() => void handleDelete(slot.slotId)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
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

const formGridStyle: CSSProperties = {
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
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#e5e7eb",
  color: "#111827",
  fontWeight: 600,
  cursor: "pointer",
};

const editButtonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#dbeafe",
  color: "#1e3a8a",
  fontWeight: 600,
  cursor: "pointer",
};

const deleteButtonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#fee2e2",
  color: "#991b1b",
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

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "14px",
  flexWrap: "wrap",
};

const tableWrapperStyle: CSSProperties = {
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: CSSProperties = {
  textAlign: "left",
  padding: "12px",
  background: "#f9fafb",
  borderBottom: "1px solid #e5e7eb",
};

const tdStyle: CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  verticalAlign: "top",
};

const actionCellStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
};
