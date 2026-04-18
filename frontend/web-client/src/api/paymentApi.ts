import { createAuthorizedApi } from "./apiClient";
import type {
  CheckoutSessionResponse,
  CreatePaymentPayload,
  Payment,
  PaymentStatus,
} from "../types/payment";

const _rawPaymentUrl = import.meta.env.VITE_PAYMENT_SERVICE_URL || "http://127.0.0.1:8006";
const PAYMENT_SERVICE_URL = (_rawPaymentUrl.startsWith("http") ? _rawPaymentUrl : `https://${_rawPaymentUrl}`).replace(/\/$/, "");

const PAYMENT_BASE_URL = `${PAYMENT_SERVICE_URL}/api/v1`;

const paymentApi = createAuthorizedApi(PAYMENT_BASE_URL);

export async function createPayment(
  payload: CreatePaymentPayload
): Promise<Payment> {
  const response = await paymentApi.post("/payments", payload);
  return response.data;
}

export async function createStripeCheckoutSession(
  paymentId: string
): Promise<CheckoutSessionResponse> {
  const response = await paymentApi.post(`/payments/${paymentId}/checkout-session`);
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

export async function verifyStripeSession(
  sessionId: string
): Promise<Payment> {
  const response = await paymentApi.post(
    `/payments/sessions/verify?session_id=${sessionId}`
  );
  return response.data;
}