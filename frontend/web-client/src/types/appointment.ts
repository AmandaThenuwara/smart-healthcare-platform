export type AppointmentStatus =
  | "PENDING"
  | "PAYMENT_PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "RESCHEDULED"
  | "CANCELLED"
  | "COMPLETED";

export type ConsultationType = "ONLINE" | "PHYSICAL";

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
  consultationType: ConsultationType;
  status: AppointmentStatus;
  statusHistory: AppointmentStatusHistoryItem[];
}

export interface UpdateAppointmentStatusPayload {
  status: AppointmentStatus;
}
