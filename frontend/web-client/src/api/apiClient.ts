import axios, { type AxiosInstance } from "axios";

const TOKEN_KEY = "smart_healthcare_token";

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function createAuthorizedApi(baseURL: string): AxiosInstance {
  const client = axios.create({
    baseURL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.request.use((config) => {
    const token = getAuthToken();

    if (token) {
      if (!config.headers) {
        config.headers = {} as typeof config.headers;
      }

      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    return config;
  });

  return client;
}
