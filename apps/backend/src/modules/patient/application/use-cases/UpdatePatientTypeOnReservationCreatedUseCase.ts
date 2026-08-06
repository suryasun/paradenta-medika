import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IReservationRepository } from '../../../reservation/domain/repositories/IReservationRepository';

export interface ReservationCreatedForPatientTypeInput {
  patientId: string;
  occurredAt: string;
}

/**
 * docs/06-tasks/task-290.md: Patient-module subscriber to
 * RESERVATION_CREATED_EVENT (published by CreateReservationUseCase /
 * WalkInRegistrationUseCase / QuickNewPatientCallUseCase), following the
 * PATIENT_CHECKED_IN_EVENT -> CreateQueueUseCase subscription precedent
 * (tests/integration/checkInToQueue.test.ts) exactly -- Reservation never
 * writes to `patients` directly (MOD-003); it only publishes an event this
 * module reacts to. Reading Reservation's own repository for the eligible-
 * reservation count is a cross-module *read*, which the existing
 * CreateQueueUseCase precedent (constructor-injecting PatientRepository/
 * DoctorRepository directly) already establishes as acceptable -- only
 * cross-module *writes* are restricted to events.
 *
 * Idempotency: `patient_type` is only flipped while it is still NEW
 * (enforced inside IPatientRepository.markAsReturning's own WHERE clause),
 * so redelivery of this event (or of an earlier reservation's event,
 * processed out of order) never re-flips an already-OLD patient or
 * overwrites an already-set first_reservation_at.
 */
export class UpdatePatientTypeOnReservationCreatedUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly reservationRepository: IReservationRepository,
  ) {}

  async execute(input: ReservationCreatedForPatientTypeInput): Promise<void> {
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient || patient.patientType !== 'NEW') {
      return;
    }

    const eligibleCount = await this.reservationRepository.countEligibleForPatient(input.patientId);
    if (eligibleCount >= 2) {
      await this.patientRepository.markAsReturning(input.patientId, new Date(input.occurredAt));
    }
  }
}
