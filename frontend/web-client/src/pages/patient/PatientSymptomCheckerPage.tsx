import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import PatientShell from "./PatientShell";
import { createSymptomCheck, getMySymptomChecks } from "../../api/aiSymptomApi";
import type { SymptomCheck } from "../../types/symptom";

export default function PatientSymptomCheckerPage() {
  const [symptomsInput, setSymptomsInput] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState<"" | "MILD" | "MODERATE" | "SEVERE">("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [history, setHistory] = useState<SymptomCheck[]>([]);
  const [latestResult, setLatestResult] = useState<SymptomCheck | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadHistory();
  }, []);

  async function loadHistory() {
    setIsLoadingHistory(true);
    setError("");

    try {
      const data = await getMySymptomChecks();
      setHistory(data);
      if (data.length > 0) {
        setLatestResult(data[0]);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to load symptom check history. Make sure your patient profile exists and the AI service is running.");
    } finally {
      setIsLoadingHistory(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setMessage("");

    const symptoms = symptomsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (symptoms.length === 0) {
      setError("Enter at least one symptom.");
      setIsSubmitting(false);
      return;
    }

    try {
      const created = await createSymptomCheck({
        symptoms,
        age: age ? Number(age) : undefined,
        sex: sex || undefined,
        duration: duration || undefined,
        severity: severity || undefined,
        additionalNotes: additionalNotes || undefined,
      });

      setLatestResult(created);
      setMessage("AI symptom check completed successfully.");
      setSymptomsInput("");
      setAge("");
      setSex("");
      setDuration("");
      setSeverity("");
      setAdditionalNotes("");

      await loadHistory();
    } catch (error) {
      console.error(error);
      setError("Failed to run AI symptom check.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PatientShell
      title="AI Symptom Checker"
      subtitle="Describe symptoms to receive a cautious AI-generated triage summary, urgency level, and next-step recommendation."
    >
      <div style={cardStyle}>
        <h2 style={sectionTitleStyle}>Run Symptom Check</h2>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={fullWidthStyle}>
            <label style={labelStyle}>Symptoms</label>
            <textarea
              value={symptomsInput}
              onChange={(e) => setSymptomsInput(e.target.value)}
              style={textareaStyle}
              placeholder="Example: fever, headache, sore throat"
              required
            />
            <p style={helpTextStyle}>Enter symptoms separated by commas.</p>
          </div>

          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={inputStyle}
                placeholder="25"
              />
            </div>

            <div>
              <label style={labelStyle}>Sex</label>
              <input
                type="text"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                style={inputStyle}
                placeholder="Male / Female / Other"
              />
            </div>

            <div>
              <label style={labelStyle}>Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={inputStyle}
                placeholder="2 days"
              />
            </div>

            <div>
              <label style={labelStyle}>Severity</label>
              <select
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as "" | "MILD" | "MODERATE" | "SEVERE")
                }
                style={inputStyle}
              >
                <option value="">Select severity</option>
                <option value="MILD">MILD</option>
                <option value="MODERATE">MODERATE</option>
                <option value="SEVERE">SEVERE</option>
              </select>
            </div>
          </div>

          <div style={fullWidthStyle}>
            <label style={labelStyle}>Additional Notes</label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              style={textareaStyle}
              placeholder="Any extra details about the symptoms"
            />
          </div>

          {error && <p style={errorStyle}>{error}</p>}
          {message && <p style={successStyle}>{message}</p>}

          <button type="submit" style={buttonStyle} disabled={isSubmitting}>
            {isSubmitting ? "Analyzing..." : "Run AI Symptom Check"}
          </button>
        </form>
      </div>

      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <h2 style={sectionTitleStyle}>Latest Result</h2>

        {!latestResult ? (
          <p style={emptyTextStyle}>No symptom check result available yet.</p>
        ) : (
          <div style={resultBoxStyle}>
            <p style={resultTextStyle}>
              <strong>Urgency:</strong> {latestResult.urgencyLevel}
            </p>
            <p style={resultTextStyle}>
              <strong>Summary:</strong> {latestResult.summary}
            </p>
            <p style={resultTextStyle}>
              <strong>Possible Conditions:</strong>{" "}
              {latestResult.possibleConditions.length > 0
                ? latestResult.possibleConditions.join(", ")
                : "None suggested"}
            </p>
            <p style={resultTextStyle}>
              <strong>Recommendation:</strong> {latestResult.recommendation}
            </p>
            <p style={resultTextStyle}>
              <strong>Red Flags:</strong>{" "}
              {latestResult.redFlags.length > 0
                ? latestResult.redFlags.join(", ")
                : "None highlighted"}
            </p>
            <p style={disclaimerStyle}>{latestResult.disclaimer}</p>
          </div>
        )}
      </div>

      <div style={{ ...cardStyle, marginTop: "20px" }}>
        <div style={headerRowStyle}>
          <h2 style={sectionTitleStyle}>History</h2>
          <button onClick={() => void loadHistory()} style={secondaryButtonStyle}>
            Refresh
          </button>
        </div>

        {isLoadingHistory ? (
          <p style={emptyTextStyle}>Loading history...</p>
        ) : history.length === 0 ? (
          <p style={emptyTextStyle}>No symptom checks found yet.</p>
        ) : (
          <div style={historyListStyle}>
            {history.map((item) => (
              <div key={item.checkId} style={historyItemStyle}>
                <p style={resultTextStyle}>
                  <strong>Date:</strong> {new Date(item.createdAt).toLocaleString()}
                </p>
                <p style={resultTextStyle}>
                  <strong>Symptoms:</strong> {item.submittedSymptoms.join(", ")}
                </p>
                <p style={resultTextStyle}>
                  <strong>Urgency:</strong> {item.urgencyLevel}
                </p>
                <p style={resultTextStyle}>
                  <strong>Recommendation:</strong> {item.recommendation}
                </p>
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

const formStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const fullWidthStyle: CSSProperties = {
  width: "100%",
};

const gridStyle: CSSProperties = {
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
  minHeight: "110px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
  boxSizing: "border-box",
  resize: "vertical",
};

const helpTextStyle: CSSProperties = {
  marginTop: "8px",
  marginBottom: 0,
  color: "#6b7280",
  fontSize: "13px",
};

const buttonStyle: CSSProperties = {
  padding: "12px 16px",
  borderRadius: "10px",
  border: "none",
  background: "#1d4ed8",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  alignSelf: "flex-start",
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

const emptyTextStyle: CSSProperties = {
  margin: 0,
  color: "#6b7280",
};

const resultBoxStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
  background: "#fcfcfd",
};

const resultTextStyle: CSSProperties = {
  margin: "8px 0",
  color: "#374151",
};

const disclaimerStyle: CSSProperties = {
  marginTop: "14px",
  padding: "12px",
  borderRadius: "10px",
  background: "#fef2f2",
  color: "#991b1b",
};

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  marginBottom: "14px",
  flexWrap: "wrap",
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
