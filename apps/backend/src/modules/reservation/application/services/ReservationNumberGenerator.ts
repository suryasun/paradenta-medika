import { IReservationRepository } from '../../domain/repositories/IReservationRepository';

const MAX_ATTEMPTS = 5;

/**
 * Format per docs/03-sad/13-module-reservation.md Section 21.2 example:
 * "RSV-20260810-0001" (RSV-YYYYMMDD-sequence).
 */
export class ReservationNumberGenerator {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async generate(reservationDate: Date): Promise<string> {
    const datePart = reservationDate.toISOString().slice(0, 10).replace(/-/g, '');
    const baseCount = await this.reservationRepository.count();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `RSV-${datePart}-${String(baseCount + 1 + attempt).padStart(4, '0')}`;
      const existing = await this.reservationRepository.findByReservationNo(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Reservation Number');
  }
}
