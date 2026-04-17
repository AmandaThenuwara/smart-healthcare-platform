import { createAuthorizedApi } from "./apiClient";
import type {
  AvailabilitySlot,
  CreateAvailabilityPayload,
  CreateDoctorPayload,
  DoctorProfile,
  UpdateDoctorPayload,
} from "../types/doctor";

const DOCTOR_SERVICE_URL = (
  import.meta.env.VITE_DOCTOR_SERVICE_URL || "http://127.0.0.1:8003"
).replace(/\/$/, "");

const DOCTOR_BASE_URL = `${DOCTOR_SERVICE_URL}/api/v1`;

const doctorApi = createAuthorizedApi(DOCTOR_BASE_URL);

const DOCTOR_PROFILE_STORAGE_KEY = "smart_healthcare_doctor_profile";

export async function createDoctorProfile(
  payload: CreateDoctorPayload
): Promise<DoctorProfile> {
  const response = await doctorApi.post("/doctors", payload);
  return response.data;
}

export async function getDoctorProfile(doctorId: string): Promise<DoctorProfile> {
  const response = await doctorApi.get(`/doctors/${doctorId}`);
  return response.data;
}

export async function updateDoctorProfile(
  doctorId: string,
  payload: UpdateDoctorPayload
): Promise<DoctorProfile> {
  const response = await doctorApi.put(`/doctors/${doctorId}`, payload);
  return response.data;
}

export async function createAvailabilitySlot(
  payload: CreateAvailabilityPayload
): Promise<AvailabilitySlot> {
  const response = await doctorApi.post("/availability", payload);
  return response.data;
}

export async function getAvailabilitySlots(
  doctorId: string
): Promise<AvailabilitySlot[]> {
  const response = await doctorApi.get(`/availability/${doctorId}`);
  return response.data;
}

export function getStoredDoctorProfile(): DoctorProfile | null {
  try {
    const raw = localStorage.getItem(DOCTOR_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DoctorProfile;
  } catch {
    localStorage.removeItem(DOCTOR_PROFILE_STORAGE_KEY);
    return null;
  }
}

export function setStoredDoctorProfile(profile: DoctorProfile) {
  localStorage.setItem(DOCTOR_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function clearStoredDoctorProfile() {
  localStorage.removeItem(DOCTOR_PROFILE_STORAGE_KEY);
}
