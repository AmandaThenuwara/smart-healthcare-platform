export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

export interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  user: UserProfile;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}