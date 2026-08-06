export interface ReservationResponseDto {
  id: string;
  reservationNumber: string;
  status: string;
  patientId: string;
  doctorId: string;
  branchId: string;
  scheduleId: string | null;
  reservationDate: string;
  startTime: string;
  reservationType: string;
  reservationSource: string;
  complaint: string | null;
  notes: string | null;
  checkedInAt: string | null;
  cancelledReason: string | null;
  cancelledAt: string | null;
  /** docs/06-tasks/task-290.md: permanent NEW/OLD snapshot taken at booking time. */
  patientType: 'NEW' | 'OLD';
  /**
   * docs/06-tasks/task-296.md (Reservation Module Addendum #2, R1): only
   * populated when the row came from a query that joined the Patient
   * relation (currently `search()` only) -- null on responses returned
   * from create/update/cancel/checkIn/detail, which don't need it.
   */
  patientMrn: string | null;
  patientFullName: string | null;
}
