import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PatientShell from "./PatientShell";
import {
  createMedicalReport,
  getMedicalReportsByPatient,
  getStoredPatientProfile,
} from "../../api/patientApi";
import type { MedicalReport } from "../../types/patient";

function sortReports(reports: MedicalReport[]) {
  return [...reports].sort((a, b) => {
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });
}

export default function PatientReportsPage() {
  const [patientId, setPatientId] = useState("");
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    fileName: "",
    fileUrl: "",
    reportType: "",
  });

  useEffect(() => {
    const storedPatient = getStoredPatientProfile();

    if (!storedPatient) {
      setIsLoading(false);
      return;
    }

    setPatientId(storedPatient.patientId);
    void loadReports(storedPatient.patientId);
  }, []);

  async function loadReports(currentPatientId: string) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getMedicalReportsByPatient(currentPatientId);
      setReports(sortReports(data));
    } catch (error) {
      console.error(error);
      setError("Failed to load medical reports");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!patientId) {
      setError("Create the patient profile first.");
      return;
    }

    try {
      await createMedicalReport({
        patientId,
        title: form.title.trim(),
        fileName: form.fileName.trim(),
        fileUrl: form.fileUrl.trim(),
        reportType: form.reportType.trim(),
      });

      setMessage("Medical report metadata created successfully.");
      setForm({
        title: "",
        fileName: "",
        fileUrl: "",
        reportType: "",
      });

      await loadReports(patientId);
    } catch (error) {
      console.error(error);
      setError("Failed to create medical report metadata");
    }
  }

  return (
    <PatientShell
      title="Medical Reports"
      subtitle="Create and review medical report metadata entries."
    >
      {!patientId ? (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Patient Profile Needed</h2>
          <p style={textStyle}>
            Please create the patient profile first so the frontend has a saved
            patientId to use.
          </p>
          <Link to="/patient/profile" style={linkButtonStyle}>
            Go to Patient Profile
          </Link>
        </div>
      ) : (
        <>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Add Report Metadata</h2>

            <form onSubmit={handleSubmit} style={formGridStyle}>
              <div>
                <label style={labelStyle}>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  style={inputStyle}
                  placeholder="Blood Test Report"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>File Name</label>
                <input
                  type="text"
                  value={form.fileName}
                  onChange={(e) =>
                    setForm({ ...form, fileName: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="blood-test.pdf"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>File URL</label>
                <input
                  type="text"
                  value={form.fileUrl}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  style={inputStyle}
                  placeholder="/uploads/blood-test.pdf"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Report Type</label>
                <input
                  type="text"
                  value={form.reportType}
                  onChange={(e) =>
                    setForm({ ...form, reportType: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="Lab Report"
                  required
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                {error && <p style={errorStyle}>{error}</p>}
                {message && <p style={successStyle}>{message}</p>}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <button type="submit" style={buttonStyle}>
                  Add Report Metadata
                </button>
              </div>
            </form>
          </div>

          <div style={{ ...cardStyle, marginTop: "20px" }}>
            <div style={headerRowStyle}>
              <h2 style={sectionTitleStyle}>Existing Reports</h2>
              <button onClick={() => void loadReports(patientId)} style={secondaryButtonStyle}>
                Refresh
              </button>
            </div>

            {isLoading ? (
              <p style={textStyle}>Loading reports...</p>
            ) : reports.length === 0 ? (
              <p style={textStyle}>No medical reports found yet.</p>
            ) : (
              <div style={reportsListStyle}>
                {reports.map((report) => (
                  <div key={report.reportId} style={reportCardStyle}>
                    <h3 style={reportTitleStyle}>{report.title}</h3>
                    <p style={metaTextStyle}>
                      <strong>Type:</strong> {report.reportType}
                    </p>
                    <p style={metaTextStyle}>
                      <strong>File Name:</strong> {report.fileName}
                    </p>
                    <p style={metaTextStyle}>
                      <strong>File URL:</strong> {report.fileUrl}
                    </p>
                    <p style={metaTextStyle}>
                      <strong>Uploaded At:</strong>{" "}
                      {new Date(report.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
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

const reportsListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const reportCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
  background: "#fcfcfd",
};

const reportTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
};

const metaTextStyle: CSSProperties = {
  margin: "6px 0",
  color: "#374151",
};
