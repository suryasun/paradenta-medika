export interface AllergyResponseDto {
  id: string;
  patientId: string;
  visitId: string | null;
  type: string;
  allergen: string;
  severity: string;
  reaction: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: string | null;
}
