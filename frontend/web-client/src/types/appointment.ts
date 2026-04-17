export type AppointmentStatus =
  | "PENDING"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "RESCHEDULED"
  | "CANCELLED"
  | "COMPLETED";

export interface AppointmentStatusHistoryItem {
  status: AppointmentStatus;
  changedAt: string;
}

export interface Appointment {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  reason: string;
  consultationType: "ONLINE" | "PHYSICAL";
  status: AppointmentStatus;
  statusHistory: AppointmentStatusHistoryItem[];
}

export interface CreateAppointmentPayload {
  patientId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  reason: string;
  consultationType: "ONLINE" | "PHYSICAL";
}
