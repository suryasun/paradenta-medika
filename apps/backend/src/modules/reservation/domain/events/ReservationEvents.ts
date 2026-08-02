/**
 * docs/03-sad/13-module-reservation.md Section 25.1 Published Events /
 * Section 25.4 Event Payload Example.
 */
export const RESERVATION_CREATED_EVENT = 'ReservationCreated';
export const RESERVATION_UPDATED_EVENT = 'ReservationUpdated';
export const RESERVATION_RESCHEDULED_EVENT = 'ReservationRescheduled';
export const RESERVATION_CANCELLED_EVENT = 'ReservationCancelled';
/**
 * docs/06-tasks/task-035.md: check-in publishes this event rather than
 * Reservation depending directly on Queue's CreateQueueUseCase, so the
 * Queue module can create the corresponding entry via subscription instead
 * of a cross-module import.
 */
export const PATIENT_CHECKED_IN_EVENT = 'PatientCheckedIn';

export interface ReservationEventPayload {
  event: string;
  reservationId: string;
  reservationNumber: string;
  patientId: string;
  doctorId: string;
  reservationDate: string;
  startTime: string;
  status: string;
  occurredAt: string;
}

export interface PatientCheckedInPayload {
  event: typeof PATIENT_CHECKED_IN_EVENT;
  reservationId: string;
  reservationNumber: string;
  patientId: string;
  doctorId: string;
  branchId: string;
  occurredAt: string;
}
