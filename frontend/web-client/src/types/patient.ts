export interface PatientProfile {
  patientId: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface CreatePatientPayload {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export interface UpdatePatientPayload {
  fullName?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface MedicalReport {
  reportId: string;
  patientId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  reportType: string;
  uploadedAt: string;
}

export interface CreateReportPayload {
  patientId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  reportType: string;
}
