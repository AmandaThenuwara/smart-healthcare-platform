import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import type { PaymentStatus, Payment } from "../../types/payment";
import {
  createPayment,
  getPaymentsByPatient,
  updatePaymentStatus,
} from "../../api/paymentApi";
import { getStoredPatientProfile } from "../../api/patientApi";
import PatientShell from "./PatientShell";
import { Link } from "react-router-dom";

const PAYMENT_STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

function sortPayments(data: Payment[]) {
  return [...data].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export default function PatientPaymentsPage() {
  const [patientId, setPatientId] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingStatuses, setPendingStatuses] = useState<Record<string, PaymentStatus>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    appointmentId: "",
    amount: "3000",
    currency: "LKR",
    paymentMethod: "ONLINE",
  });

  useEffect(() => {
    const storedPatient = getStoredPatientProfile();

    if (!storedPatient) {
      setIsLoading(false);
      return;
    }

    setPatientId(storedPatient.patientId);
    void loadPayments(storedPatient.patientId);
  }, []);

  async function loadPayments(currentPatientId: string) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getPaymentsByPatient(currentPatientId);
      const sorted = sortPayments(data);
      setPayments(sorted);

      const nextStatuses: Record<string, PaymentStatus> = {};
      sorted.forEach((payment) => {
        nextStatuses[payment.paymentId] = payment.status;
      });
      setPendingStatuses(nextStatuses);
    } catch (error) {
      console.error(error);
      setError("Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreatePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!patientId) {
      setError("Create the patient profile first.");
      return;
    }

    const amount = Number(form.amount);

    if (Number.isNaN(amount)) {
      setError("Amount must be a valid number.");
      return;
    }

    try {
      await createPayment({
        appointmentId: form.appointmentId.trim(),
        patientId,
        amount,
        currency: form.currency.trim(),
        paymentMethod: form.paymentMethod.trim(),
        provider: "STRIPE_SANDBOX",
        status: "PENDING",
      });

      setMessage("Payment created successfully.");
      setForm({
        appointmentId: "",
        amount: "3000",
        currency: "LKR",
        paymentMethod: "ONLINE",
      });

      await loadPayments(patientId);
    } catch (error) {
      console.error(error);
      setError("Failed to create payment");
    }
  }

  async function handleStatusUpdate(paymentId: string) {
    const nextStatus = pendingStatuses[paymentId];

    if (!nextStatus) return;

    setError("");
    setMessage("");

    try {
      const updated = await updatePaymentStatus(paymentId, nextStatus);

      setPayments((prev) =>
        sortPayments(
          prev.map((payment) => (payment.paymentId === paymentId ? updated : payment))
        )
      );

      setPendingStatuses((prev) => ({
        ...prev,
        [paymentId]: updated.status,
      }));

      setMessage(`Payment ${paymentId} updated to ${updated.status}.`);
    } catch (error) {
      console.error(error);
      setError(`Failed to update payment ${paymentId}`);
    }
  }

  return (
    <PatientShell
      title="Payments"
      subtitle="Create payments, review payment history, and update payment status."
    >
      {!patientId ? (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Patient Profile Needed</h2>
          <p style={textStyle}>
            Please create the patient profile first so the frontend knows which
            patient payments to load.
          </p>
          <Link to="/patient/profile" style={primaryLinkStyle}>
            Go to Patient Profile
          </Link>
        </div>
      ) : (
        <>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Create Payment</h2>

            <form onSubmit={handleCreatePayment} style={formGridStyle}>
              <div>
                <label style={labelStyle}>Appointment ID</label>
                <input
                  type="text"
                  value={form.appointmentId}
                  onChange={(e) =>
                    setForm({ ...form, appointmentId: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="67f323abc456def789003333"
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Amount</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Currency</label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Payment Method</label>
                <input
                  type="text"
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({ ...form, paymentMethod: e.target.value })
                  }
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                {error && <p style={errorStyle}>{error}</p>}
                {message && <p style={successStyle}>{message}</p>}
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <button type="submit" style={buttonStyle}>
                  Create Payment
                </button>
              </div>
            </form>
          </div>

          <div style={{ ...cardStyle, marginTop: "20px" }}>
            <div style={headerRowStyle}>
              <h2 style={sectionTitleStyle}>Payment History</h2>
              <button onClick={() => void loadPayments(patientId)} style={secondaryButtonStyle}>
                Refresh
              </button>
            </div>

            {isLoading ? (
              <p style={textStyle}>Loading payments...</p>
            ) : payments.length === 0 ? (
              <p style={textStyle}>No payments found yet.</p>
            ) : (
              <div style={paymentsListStyle}>
                {payments.map((payment) => (
                  <div key={payment.paymentId} style={paymentCardStyle}>
                    <div style={paymentHeaderStyle}>
                      <h3 style={paymentTitleStyle}>Payment #{payment.paymentId}</h3>
                      <span style={statusBadgeStyle}>{payment.status}</span>
                    </div>

                    <p style={metaTextStyle}>
                      <strong>Appointment ID:</strong> {payment.appointmentId}
                    </p>
                    <p style={metaTextStyle}>
                      <strong>Amount:</strong> {payment.amount} {payment.currency}
                    </p>
                    <p style={metaTextStyle}>
                      <strong>Method:</strong> {payment.paymentMethod}
                    </p>
                    <p style={metaTextStyle}>
                      <strong>Provider:</strong> {payment.provider}
                    </p>
                    <p style={metaTextStyle}>
                      <strong>Created At:</strong>{" "}
                      {new Date(payment.createdAt).toLocaleString()}
                    </p>

                    <div style={updateRowStyle}>
                      <select
                        value={pendingStatuses[payment.paymentId] || payment.status}
                        onChange={(e) =>
                          setPendingStatuses((prev) => ({
                            ...prev,
                            [payment.paymentId]: e.target.value as PaymentStatus,
                          }))
                        }
                        style={selectStyle}
                      >
                        {PAYMENT_STATUSES.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => void handleStatusUpdate(payment.paymentId)}
                        style={buttonStyle}
                      >
                        Update Status
                      </button>
                    </div>
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

const primaryLinkStyle: CSSProperties = {
  display: "inline-block",
  textDecoration: "none",
  padding: "12px 16px",
  borderRadius: "10px",
  background: "#1d4ed8",
  color: "white",
  fontWeight: 600,
  marginTop: "16px",
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

const paymentsListStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const paymentCardStyle: CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "18px",
  background: "#fcfcfd",
};

const paymentHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
  alignItems: "center",
  flexWrap: "wrap",
};

const paymentTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: "12px",
};

const metaTextStyle: CSSProperties = {
  margin: "6px 0",
  color: "#374151",
};

const statusBadgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1e3a8a",
  fontWeight: 700,
  fontSize: "12px",
};

const updateRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  marginTop: "16px",
  flexWrap: "wrap",
};

const selectStyle: CSSProperties = {
  minWidth: "220px",
  padding: "12px",
  borderRadius: "10px",
  border: "1px solid #d1d5db",
};
