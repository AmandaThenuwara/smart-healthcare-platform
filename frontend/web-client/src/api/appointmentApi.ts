import { createAuthorizedApi } from "./apiClient";
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentPayload,
} from "../types/appointment";

const APPOINTMENT_SERVICE_URL = (
  import.meta.env.VITE_APPOINTMENT_SERVICE_URL || "http://127.0.0.1:8004"
).replace(/\/$/, "");

const APPOINTMENT_BASE_URL = `${APPOINTMENT_SERVICE_URL}/api/v1`;

const appointmentApi = createAuthorizedApi(APPOINTMENT_BASE_URL);

export async function createAppointment(
  payload: CreateAppointmentPayload
): Promise<Appointment> {
  const response = await appointmentApi.post("/appointments", payload);
  return response.data;
}

export async function getAppointmentById(
  appointmentId: string
): Promise<Appointment> {
  const response = await appointmentApi.get(`/appointments/${appointmentId}`);
  return response.data;
}

export async function getAppointmentsByPatient(
  patientId: string
): Promise<Appointment[]> {
  const response = await appointmentApi.get(`/appointments/patient/${patientId}`);
  return response.data;
}

export async function getAppointmentsByDoctor(
  doctorId: string
): Promise<Appointment[]> {
  const response = await appointmentApi.get(`/appointments/doctor/${doctorId}`);
  return response.data;
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<Appointment> {
  const response = await appointmentApi.put(
    `/appointments/${appointmentId}/status`,
    { status }
  );
  return response.data;
}

export async function cancelMyAppointment(
  appointmentId: string
): Promise<Appointment> {
  const response = await appointmentApi.post(`/appointments/${appointmentId}/cancel`);
  return response.data;
}
