import axios from "axios";
import type { CreatePaymentPayload, Payment, PaymentStatus } from "../types/payment";

const PAYMENT_SERVICE_URL = (
  import.meta.env.VITE_PAYMENT_SERVICE_URL || "http://127.0.0.1:8006"
).replace(/\/$/, "");

const PAYMENT_BASE_URL = `${PAYMENT_SERVICE_URL}/api/v1`;

const paymentApi = axios.create({
  baseURL: PAYMENT_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function createPayment(
  payload: CreatePaymentPayload
): Promise<Payment> {
  const response = await paymentApi.post("/payments", payload);
  return response.data;
}

export async function getPaymentByAppointment(
  appointmentId: string
): Promise<Payment> {
  const response = await paymentApi.get(`/payments/appointment/${appointmentId}`);
  return response.data;
}

export async function getPaymentsByPatient(
  patientId: string
): Promise<Payment[]> {
  const response = await paymentApi.get(`/payments/patient/${patientId}`);
  return response.data;
}

export async function updatePaymentStatus(
  paymentId: string,
  status: PaymentStatus
): Promise<Payment> {
  const response = await paymentApi.put(`/payments/${paymentId}/status`, {
    status,
  });
  return response.data;
}
