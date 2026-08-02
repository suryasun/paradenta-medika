import { Reservation } from '@prisma/client';
import { ReservationResponseDto } from '../dtos/ReservationResponseDto';

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toTimeString(date: Date): string {
  return date.toISOString().slice(11, 16);
}

/**
 * Simplified relative to docs/03-sad/13-module-reservation.md Section 21.2's
 * `patient: {}`/`doctor: {}`/`schedule: {}` nested objects: this module
 * does not embed full cross-module entity snapshots, only their ids --
 * clients fetch full Patient/Doctor detail from those modules' own
 * endpoints (task-028, task-023) rather than receiving a duplicated copy.
 */
export function toReservationResponse(reservation: Reservation): ReservationResponseDto {
  return {
    id: reservation.id,
    reservationNumber: reservation.reservationNo,
    status: reservation.status,
    patientId: reservation.patientId,
    doctorId: reservation.doctorId,
    branchId: reservation.branchId,
    scheduleId: reservation.scheduleId,
    reservationDate: toIsoDate(reservation.reservationDate),
    startTime: toTimeString(reservation.reservationTime),
    reservationType: reservation.reservationType,
    reservationSource: reservation.source,
    complaint: reservation.complaint,
    notes: reservation.notes,
    checkedInAt: reservation.checkedInAt ? reservation.checkedInAt.toISOString() : null,
    cancelledReason: reservation.cancelledReason,
    cancelledAt: reservation.cancelledAt ? reservation.cancelledAt.toISOString() : null,
  };
}
