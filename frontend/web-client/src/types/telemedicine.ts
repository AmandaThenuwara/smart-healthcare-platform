export type TelemedicineStatus = "SCHEDULED" | "STARTED" | "ENDED";

export interface TelemedicineSession {
  sessionId: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  provider: string;
  roomName: string;
  meetingUrl: string;
  status: TelemedicineStatus;
  createdAt: string;
}

export interface CreateTelemedicinePayload {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  provider: string;
  roomName: string;
  meetingUrl: string;
  status: TelemedicineStatus;
}
