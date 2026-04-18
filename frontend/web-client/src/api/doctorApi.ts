import { createAuthorizedApi } from "./apiClient";
import type {
  AvailabilitySlot,
  CreateAvailabilityPayload,
  CreateDoctorPayload,
  DoctorBrowseItem,
  DoctorProfile,
  UpdateAvailabilityPayload,
  UpdateDoctorPayload,
} from "../types/doctor";

const _rawDoctorUrl = import.meta.env.VITE_DOCTOR_SERVICE_URL || "http://127.0.0.1:8003";
const DOCTOR_SERVICE_URL = (_rawDoctorUrl.startsWith("http") ? _rawDoctorUrl : `https://${_rawDoctorUrl}`).replace(/\/$/, "");

const DOCTOR_BASE_URL = `${DOCTOR_SERVICE_URL}/api/v1`;

const doctorApi = createAuthorizedApi(DOCTOR_BASE_URL);

const DOCTOR_PROFILE_STORAGE_KEY = "smart_healthcare_doctor_profile";

export async function createDoctorProfile(
  payload: CreateDoctorPayload
): Promise<DoctorProfile> {
  const response = await doctorApi.post("/doctors", payload);
  return response.data;
}

export async function getDoctorProfile(
  doctorId: string
): Promise<DoctorProfile> {
  const response = await doctorApi.get(`/doctors/${doctorId}`);
  return response.data;
}

export async function getMyDoctorProfile(): Promise<DoctorProfile> {
  const response = await doctorApi.get("/doctors/me");
  return response.data;
}

export async function updateDoctorProfile(
  doctorId: string,
  payload: UpdateDoctorPayload
): Promise<DoctorProfile> {
  const response = await doctorApi.put(`/doctors/${doctorId}`, payload);
  return response.data;
}

export async function browseApprovedDoctors(params?: {
  search?: string;
  specialty?: string;
  hospital?: string;
}): Promise<DoctorBrowseItem[]> {
  const response = await doctorApi.get("/doctors/browse", {
    params: {
      search: params?.search || undefined,
      specialty: params?.specialty || undefined,
      hospital: params?.hospital || undefined,
    },
  });
  return response.data;
}

export async function getPublicDoctorProfile(
  doctorId: string
): Promise<DoctorBrowseItem> {
  const response = await doctorApi.get(`/doctors/public/${doctorId}`);
  return response.data;
}

export async function createAvailabilitySlot(
  payload: CreateAvailabilityPayload
): Promise<AvailabilitySlot> {
  const response = await doctorApi.post("/availability", payload);
  return response.data;
}

export async function getAvailabilitySlots(
  doctorId: string,
  availableOnly = false
): Promise<AvailabilitySlot[]> {
  const response = await doctorApi.get(`/availability/${doctorId}`, {
    params: {
      availableOnly,
    },
  });
  return response.data;
}

export async function getAvailabilitySlot(
  slotId: string
): Promise<AvailabilitySlot> {
  const response = await doctorApi.get(`/availability/slot/${slotId}`);
  return response.data;
}

export async function updateAvailabilitySlot(
  slotId: string,
  payload: UpdateAvailabilityPayload
): Promise<AvailabilitySlot> {
  const response = await doctorApi.put(`/availability/slot/${slotId}`, payload);
  return response.data;
}

export async function deleteAvailabilitySlot(
  slotId: string
): Promise<{ message: string }> {
  const response = await doctorApi.delete(`/availability/slot/${slotId}`);
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