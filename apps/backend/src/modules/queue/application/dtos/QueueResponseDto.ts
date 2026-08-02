export interface QueueResponseDto {
  id: string;
  queueNumber: string;
  branchId: string;
  patientId: string;
  doctorId: string;
  reservationId: string | null;
  queueDate: string;
  queueType: string;
  priority: string;
  status: string;
  checkedInAt: string;
  calledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
}
