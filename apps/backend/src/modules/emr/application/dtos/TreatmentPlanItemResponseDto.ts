export interface TreatmentPlanItemResponseDto {
  id: string;
  visitId: string;
  patientId: string;
  treatmentId: string;
  toothNumber: number | null;
  surface: string | null;
  priority: string;
  estimatedCost: number;
  estimatedDurationMinute: number | null;
  createdAt: string;
  createdBy: string | null;
}
