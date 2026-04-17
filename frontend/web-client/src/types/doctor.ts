export type DoctorApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface CreateDoctorPayload {
  userId: string;
  fullName: string;
  email: string;
  specialty: string;
  qualifications: string;
  hospital: string;
  consultationFee: number;
  bio: string;
  approvalStatus: DoctorApprovalStatus;
}

export interface UpdateDoctorPayload {
  fullName?: string;
  specialty?: string;
  qualifications?: string;
  hospital?: string;
  consultationFee?: number;
  bio?: string;
  approvalStatus?: DoctorApprovalStatus;
}

export interface DoctorProfile {
  doctorId: string;
  userId: string;
  fullName: string;
  email: string;
  specialty: string;
  qualifications: string;
  hospital: string;
  consultationFee: number;
  bio: string;
  approvalStatus: DoctorApprovalStatus;
}

export interface DoctorBrowseItem {
  doctorId: string;
  fullName: string;
  specialty: string;
  qualifications: string;
  hospital: string;
  consultationFee: number;
  bio: string;
  approvalStatus: DoctorApprovalStatus;
}

export interface CreateAvailabilityPayload {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface UpdateAvailabilityPayload {
  date?: string;
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
}

export interface AvailabilitySlot {
  slotId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}