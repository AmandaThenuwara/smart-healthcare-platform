import { createAuthorizedApi } from "./apiClient";
import type { SymptomCheck, SymptomCheckCreatePayload } from "../types/symptom";

const AI_SYMPTOM_SERVICE_URL = (
  import.meta.env.VITE_AI_SYMPTOM_SERVICE_URL || "http://127.0.0.1:8008"
).replace(/\/$/, "");

const AI_SYMPTOM_BASE_URL = `${AI_SYMPTOM_SERVICE_URL}/api/v1`;

const aiSymptomApi = createAuthorizedApi(AI_SYMPTOM_BASE_URL);

export async function createSymptomCheck(
  payload: SymptomCheckCreatePayload
): Promise<SymptomCheck> {
  const response = await aiSymptomApi.post("/symptom-checks", payload);
  return response.data;
}

export async function getMySymptomChecks(): Promise<SymptomCheck[]> {
  const response = await aiSymptomApi.get("/symptom-checks/me");
  return response.data;
}
