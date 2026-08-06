export interface QueueResponseDto {
  id: string;
  queueNumber: string;
  branchId: string;
  patientId: string;
  /** docs/06-tasks/task-313.md: lightweight patient snapshot (No. RM/Nama Pasien), not a full Patient embed. */
  patientMrn: string | null;
  patientFullName: string | null;
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
  /** docs/06-tasks/task-319.md: id of the linked Visit if one already exists (any
   * status), so the frontend can navigate straight to it (View Visit) instead of
   * only being able to create a new one via the CALLED-only Open Visit action. */
  visitId: string | null;
}
