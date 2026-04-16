import axios from "axios";
import type {
  CreateTelemedicinePayload,
  TelemedicineSession,
  TelemedicineStatus,
} from "../types/telemedicine";

const TELEMEDICINE_SERVICE_URL = (
  import.meta.env.VITE_TELEMEDICINE_SERVICE_URL || "http://127.0.0.1:8005"
).replace(/\/$/, "");

const TELEMEDICINE_BASE_URL = `${TELEMEDICINE_SERVICE_URL}/api/v1`;

const telemedicineApi = axios.create({
  baseURL: TELEMEDICINE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function createTelemedicineSession(
  payload: CreateTelemedicinePayload
): Promise<TelemedicineSession> {
  const response = await telemedicineApi.post("/telemedicine", payload);
  return response.data;
}

export async function getTelemedicineSession(
  sessionId: string
): Promise<TelemedicineSession> {
  const response = await telemedicineApi.get(`/telemedicine/${sessionId}`);
  return response.data;
}

export async function getTelemedicineByAppointment(
  appointmentId: string
): Promise<TelemedicineSession> {
  const response = await telemedicineApi.get(
    `/telemedicine/appointment/${appointmentId}`
  );
  return response.data;
}

export async function updateTelemedicineStatus(
  sessionId: string,
  status: TelemedicineStatus
): Promise<TelemedicineSession> {
  const response = await telemedicineApi.put(`/telemedicine/${sessionId}/status`, {
    status,
  });
  return response.data;
}
