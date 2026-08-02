export interface FollowUpResponseDto {
  id: string;
  visitId: string;
  patientId: string;
  followUpDate: string;
  note: string | null;
  priority: string;
  reservationId: string | null;
  createdAt: string;
  createdBy: string | null;
}
