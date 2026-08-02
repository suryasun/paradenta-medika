export interface MedicalHistoryResponseDto {
  id: string;
  patientId: string;
  visitId: string | null;
  category: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string | null;
}
