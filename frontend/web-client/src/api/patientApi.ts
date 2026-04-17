import { createAuthorizedApi } from "./apiClient";
import type {
  CreatePatientPayload,
  CreateReportPayload,
  MedicalReport,
  PatientProfile,
  UpdatePatientPayload,
} from "../types/patient";

const PATIENT_SERVICE_URL = (
  import.meta.env.VITE_PATIENT_SERVICE_URL || "http://127.0.0.1:8002"
).replace(/\/$/, "");

const PATIENT_BASE_URL = `${PATIENT_SERVICE_URL}/api/v1`;

const patientApi = createAuthorizedApi(PATIENT_BASE_URL);

const PATIENT_PROFILE_STORAGE_KEY = "smart_healthcare_patient_profile";

export async function createPatientProfile(
  payload: CreatePatientPayload
): Promise<PatientProfile> {
  const response = await patientApi.post("/patients", payload);
  return response.data;
}

export async function getMyPatientProfile(): Promise<PatientProfile> {
  const response = await patientApi.get("/patients/me");
  return response.data;
}

export async function getPatientProfile(patientId: string): Promise<PatientProfile> {
  const response = await patientApi.get(`/patients/${patientId}`);
  return response.data;
}

export async function updatePatientProfile(
  patientId: string,
  payload: UpdatePatientPayload
): Promise<PatientProfile> {
  const response = await patientApi.put(`/patients/${patientId}`, payload);
  return response.data;
}

export async function createMedicalReport(
  payload: CreateReportPayload
): Promise<MedicalReport> {
  const response = await patientApi.post("/reports", payload);
  return response.data;
}

export async function getMedicalReportsByPatient(
  patientId: string
): Promise<MedicalReport[]> {
  const response = await patientApi.get(`/reports/patient/${patientId}`);
  return response.data;
}

export function getStoredPatientProfile(): PatientProfile | null {
  try {
    const raw = localStorage.getItem(PATIENT_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PatientProfile;
  } catch {
    localStorage.removeItem(PATIENT_PROFILE_STORAGE_KEY);
    return null;
  }
}

export function setStoredPatientProfile(profile: PatientProfile) {
  localStorage.setItem(PATIENT_PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function clearStoredPatientProfile() {
  localStorage.removeItem(PATIENT_PROFILE_STORAGE_KEY);
}