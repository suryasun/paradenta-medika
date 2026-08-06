import { Patient, Reservation } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { toPatientCreateData } from '../../../patient/infrastructure/repositories/PatientRepository';
import { IQuickNewPatientCallRepository, QuickNewPatientCallWriteInput } from '../../domain/repositories/IQuickNewPatientCallRepository';
import { toReservationCreateData } from './ReservationRepository';

/**
 * docs/06-tasks/task-292.md: single `prisma.$transaction` covering both
 * inserts -- if the reservation insert fails for any reason (schedule row
 * gone, DB constraint, etc.), the patient insert in the same transaction is
 * rolled back too, and vice versa. Mirrors the existing
 * PatientAddressRepository.setPrimary() `$transaction` precedent.
 */
export class QuickNewPatientCallRepository implements IQuickNewPatientCallRepository {
  async execute(input: QuickNewPatientCallWriteInput): Promise<{ patient: Patient; reservation: Reservation }> {
    return prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({ data: toPatientCreateData(input.medicalRecordNo, input.patientProps) });
      const reservation = await tx.reservation.create({
        data: toReservationCreateData({ ...input.reservation, patientId: patient.id }),
      });
      return { patient, reservation };
    });
  }
}
