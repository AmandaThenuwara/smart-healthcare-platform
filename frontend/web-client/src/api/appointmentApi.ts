import axios from "axios";
import type { Appointment, AppointmentStatus } from "../types/appointment";

const APPOINTMENT_SERVICE_URL = (
  import.meta.env.VITE_APPOINTMENT_SERVICE_URL || "http://127.0.0.1:8004"
).replace(/\/$/, "");

const APPOINTMENT_BASE_URL = `${APPOINTMENT_SERVICE_URL}/api/v1`;

const appointmentApi = axios.create({
  baseURL: APPOINTMENT_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
