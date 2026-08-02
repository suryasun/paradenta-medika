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
}
