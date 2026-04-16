import axios from "axios";
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  UserProfile,
} from "../types/auth";

const AUTH_SERVICE_URL = (
  import.meta.env.VITE_AUTH_SERVICE_URL || "http://127.0.0.1:8001"
).replace(/\/$/, "");

const AUTH_BASE_URL = `${AUTH_SERVICE_URL}/api/v1/auth`;

const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function registerUser(payload: RegisterPayload) {
  const response = await authApi.post("/register", payload);
  return response.data;
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const response = await authApi.post("/login", payload);
  return response.data;
}

export async function getProfile(token: string): Promise<UserProfile> {
  const response = await authApi.get("/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}