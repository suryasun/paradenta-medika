export interface OdontogramEntryResponseDto {
  id: string;
  visitId: string;
  patientId: string;
  toothNumber: number;
  surface: string | null;
  toothConditionId: string;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
}
