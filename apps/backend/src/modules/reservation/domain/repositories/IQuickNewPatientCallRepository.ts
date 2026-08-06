import { Patient, Reservation } from '@prisma/client';
import { PatientProps } from '../../../patient/domain/entities/PatientEntity';
import { CreateReservationInput } from './IReservationRepository';

export interface QuickNewPatientCallWriteInput {
  medicalRecordNo: string;
  patientProps: PatientProps;
  /** `patientId` is filled in by the implementation once the patient row exists inside the same transaction. */
  reservation: Omit<CreateReservationInput, 'patientId'>;
}

/**
 * docs/06-tasks/task-292.md: the one piece of genuinely new write logic
 * this task introduces -- a single atomic patient+reservation insert, so
 * that a failure creating the reservation (e.g. the slot was taken by a
 * concurrent booking) never leaves an orphaned patient record behind, and
 * vice versa. Everything else (duplicate-identity check, schedule
 * validation, MRN/reservation-number generation, patient_type_at_booking
 * determination) is read-only and reuses QuickAddPatientUseCase's/
 * CreateReservationUseCase's existing services directly -- this interface
 * exists only for the two-table write that neither of those use cases'
 * own repositories can make atomic on their own (each only ever writes to
 * its own aggregate's table).
 */
export interface IQuickNewPatientCallRepository {
  execute(input: QuickNewPatientCallWriteInput): Promise<{ patient: Patient; reservation: Reservation }>;
}
