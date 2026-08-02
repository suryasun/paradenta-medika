import { ReservationDateInPastException } from '../exceptions/ReservationExceptions';

/**
 * docs/03-sad/13-module-reservation.md Section 12.6 / 15.3: "Tanggal tidak
 * boleh di masa lalu." Kept as a static domain rule (rather than a full
 * aggregate wrapper) since the remaining Reservation invariants -- schedule
 * validity, slot capacity, double booking -- require repository lookups and
 * live in DoctorScheduleValidator (application/services), not the entity.
 */
export class ReservationEntity {
  static assertDateNotInPast(reservationDate: Date): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(reservationDate);
    compareDate.setHours(0, 0, 0, 0);
    if (compareDate.getTime() < today.getTime()) {
      throw new ReservationDateInPastException();
    }
  }
}
