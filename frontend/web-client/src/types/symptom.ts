export type SymptomUrgency = "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";

export interface SymptomCheckCreatePayload {
  symptoms: string[];
  age?: number;
  sex?: string;
  duration?: string;
  severity?: "MILD" | "MODERATE" | "SEVERE";
  additionalNotes?: string;
}

export interface SymptomCheck {
  checkId: string;
  patientId: string;
  userId: string;
  submittedSymptoms: string[];
  summary: string;
  urgencyLevel: SymptomUrgency;
  possibleConditions: string[];
  recommendation: string;
  redFlags: string[];
  disclaimer: string;
  createdAt: string;
}
