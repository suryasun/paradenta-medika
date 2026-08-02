// Mirrors apps/backend/src/modules/emr/application/dtos/VisitResponseDto.ts
export interface Visit {
  id: string;
  visitNo: string;
  reservationId: string | null;
  patientId: string;
  doctorId: string;
  branchId: string;
  queueId: string;
  visitDate: string;
  chiefComplaint: string | null;
  status: "DRAFT" | "WAITING_EXAMINATION" | "IN_PROGRESS" | "COMPLETED" | "LOCKED" | "ARCHIVED";
  startedAt: string | null;
  finishedAt: string | null;
}

export interface VitalSign {
  id: string;
  bloodPressure: string | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  oxygenSaturation: number | null;
  recordedAt: string;
}

export interface SoapNote {
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
}

export type DiagnosisType = "PRIMARY" | "SECONDARY" | "DIFFERENTIAL";

export interface Diagnosis {
  id: string;
  diagnosisType: DiagnosisType;
  diagnosisName: string;
  notes: string | null;
}

export interface TreatmentEntry {
  id: string;
  treatmentId: string;
  toothReference: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
}

export interface VisitDetail extends Visit {
  vitalSigns: VitalSign[];
  soapNote: SoapNote | null;
  diagnoses: Diagnosis[];
  treatmentEntries: TreatmentEntry[];
}

export interface RecordVitalSignInput {
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
}

export interface SoapNoteInput {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
}

export interface DiagnosisEntryInput {
  diagnosisType: DiagnosisType;
  diagnosisName: string;
  notes?: string;
}

export interface RecordTreatmentInput {
  treatmentId: string;
  toothReference?: string;
  quantity?: number;
  notes?: string;
}

export const OPEN_VISIT_STATUSES: Visit["status"][] = ["DRAFT", "WAITING_EXAMINATION", "IN_PROGRESS"];
