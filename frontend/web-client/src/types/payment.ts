export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface Payment {
  paymentId: string;
  appointmentId: string;
  patientId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  provider: string;
  status: PaymentStatus;
  createdAt: string;
}

export interface CreatePaymentPayload {
  appointmentId: string;
  patientId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  provider: string;
  status: PaymentStatus;
}

export interface CheckoutSessionResponse {
  paymentId: string;
  checkoutUrl: string;
  sessionId: string;
}