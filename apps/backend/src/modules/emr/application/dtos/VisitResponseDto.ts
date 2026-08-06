export interface VisitResponseDto {
  id: string;
  visitNo: string;
  reservationId: string | null;
  patientId: string;
  doctorId: string;
  branchId: string;
  queueId: string;
  visitDate: string;
  chiefComplaint: string | null;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface VitalSignResponseDto {
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

export interface SoapNoteResponseDto {
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
}

export interface DiagnosisResponseDto {
  id: string;
  diagnosisType: string;
  diagnosisName: string;
  notes: string | null;
}

export interface TreatmentMaterialResponseDto {
  itemId: string;
  quantity: number;
}

export interface TreatmentEntryResponseDto {
  id: string;
  treatmentId: string;
  toothReference: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
  materials: TreatmentMaterialResponseDto[];
}

export interface VisitDetailResponseDto extends VisitResponseDto {
  vitalSigns: VitalSignResponseDto[];
  soapNote: SoapNoteResponseDto | null;
  diagnoses: DiagnosisResponseDto[];
  treatmentEntries: TreatmentEntryResponseDto[];
  /** docs/06-tasks/task-318.md: true when the Visit's linked Invoice is PAID -- Treatment
   * specifically locks on this, independent of the Visit's own status (task-317). */
  isTreatmentLocked: boolean;
}
