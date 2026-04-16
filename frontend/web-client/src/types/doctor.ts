export type DoctorApprovalStatus = "APPROVED" | "PENDING" | "REJECTED";

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
  approvalStatus: DoctorApprovalStatus | string;
}

export interface CreateDoctorPayload {
  userId: string;
  fullName: string;
  email: string;
  specialty: string;
  qualifications: string;
  hospital: string;
  consultationFee: number;
  bio: string;
  approvalStatus: DoctorApprovalStatus | string;
}

export interface UpdateDoctorPayload {
  fullName?: string;
  specialty?: string;
  qualifications?: string;
  hospital?: string;
  consultationFee?: number;
  bio?: string;
  approvalStatus?: DoctorApprovalStatus | string;
}

export interface AvailabilitySlot {
  slotId: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface CreateAvailabilityPayload {
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}
