export interface ReferralResponseDto {
  id: string;
  visitId: string;
  patientId: string;
  targetType: string;
  reason: string;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
}
