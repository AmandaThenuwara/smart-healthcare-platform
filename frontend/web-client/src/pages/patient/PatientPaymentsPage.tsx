import { useEffect, useState, type FormEvent } from "react";
import type { PaymentStatus, Payment } from "../../types/payment";
import {
  createPayment,
  getPaymentsByPatient,
  updatePaymentStatus,
} from "../../api/paymentApi";
import { getStoredPatientProfile } from "../../api/patientApi";
import PatientShell from "./PatientShell";
import { Link } from "react-router-dom";
import { 
  CreditCard, 
  Plus, 
  RefreshCw, 
  History, 
  ShoppingBag, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  DollarSign
} from "lucide-react";

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
        <div className="bg-white rounded-[24px] p-12 shadow-soft flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <AlertCircle size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Patient Profile Needed</h2>
            <p className="text-slate-500 max-w-md">
              Please create the patient profile first so the frontend knows which
              patient payments to load.
            </p>
          </div>
          <Link to="/patient/profile" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg hover:bg-slate-800 transition-all">
            Go to Patient Profile
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50 mb-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                <Plus size={20} />
              </div>
              <h2 className="text-[17px] font-bold text-slate-800">Create Payment</h2>
            </div>

            <form onSubmit={handleCreatePayment} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">Appointment ID</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <Hash size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={form.appointmentId}
                    onChange={(e) => setForm({ ...form, appointmentId: e.target.value })}
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                    placeholder="ID..."
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">Amount</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <DollarSign size={16} className="text-slate-400" />
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">Currency</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <CreditCard size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[13px] font-bold text-slate-600 ml-1">Method</label>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 rounded-[12px] focus-within:ring-2 focus-within:ring-slate-200 transition-all">
                  <ShoppingBag size={16} className="text-slate-400" />
                  <input
                    type="text"
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full py-3.5 bg-transparent outline-none text-[14px] text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="lg:col-span-4 mt-2">
                {error && <p className="text-rose-500 text-sm font-medium mb-4">{error}</p>}
                {message && <p className="text-emerald-500 text-sm font-medium mb-4">{message}</p>}
                
                <button type="submit" className="bg-[#0f172a] text-white px-8 py-4 rounded-[15px] font-bold text-[14px] shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all flex items-center gap-2">
                  <Plus size={18} />
                  <span>Create Payment</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-[24px] p-8 shadow-soft border border-slate-100/50">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                  <History size={20} />
                </div>
                <h2 className="text-[17px] font-bold text-slate-800">Payment History</h2>
              </div>
              <button onClick={() => void loadPayments(patientId)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-[12px] font-bold text-[13px] hover:bg-slate-200 transition-all">
                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <RefreshCw size={32} className="animate-spin text-slate-300" />
                <p className="text-slate-400 font-medium">Loading payments...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4 text-center">
                <ShoppingBag size={48} className="text-slate-100" />
                <p className="text-slate-400 font-medium">No payments found yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {payments.map((payment) => (
                  <div key={payment.paymentId} className="p-6 rounded-[22px] border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-white transition-all duration-300">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-[15px] font-bold text-slate-800">Payment #{payment.paymentId}</h3>
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider ${
                            payment.status === "PAID" ? "bg-emerald-100 text-emerald-600" :
                            payment.status === "FAILED" ? "bg-rose-100 text-rose-600" :
                            "bg-amber-100 text-amber-600"
                          }`}>
                            {payment.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Amount</span>
                            <span className="text-[14px] font-bold text-slate-700">{payment.amount} {payment.currency}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Method</span>
                            <span className="text-[14px] font-bold text-slate-700">{payment.paymentMethod}</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Date</span>
                            <div className="flex items-center gap-1.5 text-[14px] font-bold text-slate-700">
                              <Calendar size={14} className="text-slate-400" />
                              <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Appointment</span>
                            <span className="text-[14px] font-bold text-slate-700 truncate">{payment.appointmentId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3 lg:pl-6 lg:border-l border-slate-200">
                        <select
                          value={pendingStatuses[payment.paymentId] || payment.status}
                          onChange={(e) =>
                            setPendingStatuses((prev) => ({
                              ...prev,
                              [payment.paymentId]: e.target.value as PaymentStatus,
                            }))
                          }
                          className="min-w-[140px] p-3 bg-white border border-slate-200 rounded-[12px] text-[13px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-slate-100"
                        >
                          {PAYMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => void handleStatusUpdate(payment.paymentId)}
                          className="flex items-center gap-2 bg-[#0f172a] text-white px-6 py-3 rounded-[12px] font-bold text-[13px] hover:bg-slate-800 transition-all whitespace-nowrap"
                        >
                          <CheckCircle2 size={16} />
                          <span>Update</span>
                        </button>
                      </div>
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
