import { UpdatePatientTypeOnReservationCreatedUseCase } from './UpdatePatientTypeOnReservationCreatedUseCase';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { FakeReservationRepository } from '../../../../../tests/fakes/reservationFakes';
import { parseTimeToDate } from '../../../reservation/application/services/timeUtils';

async function seedPatient(repo: FakePatientRepository) {
  return repo.create('MRN000001', {
    patientName: 'Jane Doe',
    gender: 'FEMALE',
    birthDate: new Date('1998-08-10'),
    phone: '08123456789',
    address: 'Jl. Contoh No. 10',
  });
}

// docs/06-tasks/task-290.md Testing Required: verified via a fake event
// bus + fake Patient repository, matching checkInToQueue.test.ts's
// cross-module test shape (this file exercises the use case directly
// rather than through the event bus, since the wiring itself lives in
// patient.routes.ts's composition root, not in application logic).
describe('UpdatePatientTypeOnReservationCreatedUseCase (task-290)', () => {
  it('leaves patient_type as NEW after only one eligible reservation', async () => {
    const patientRepository = new FakePatientRepository();
    const reservationRepository = new FakeReservationRepository();
    const patient = await seedPatient(patientRepository);
    await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: patient.id,
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: new Date(),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      patientTypeAtBooking: 'NEW',
      createdBy: 'staff-1',
    });

    const useCase = new UpdatePatientTypeOnReservationCreatedUseCase(patientRepository, reservationRepository);
    await useCase.execute({ patientId: patient.id, occurredAt: new Date().toISOString() });

    const updated = await patientRepository.findById(patient.id);
    expect(updated?.patientType).toBe('NEW');
    expect(updated?.firstReservationAt).toBeNull();
  });

  it('flips patient_type to OLD and sets first_reservation_at on the second eligible reservation', async () => {
    const patientRepository = new FakePatientRepository();
    const reservationRepository = new FakeReservationRepository();
    const patient = await seedPatient(patientRepository);
    await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: patient.id,
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: new Date(),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      patientTypeAtBooking: 'NEW',
      createdBy: 'staff-1',
    });
    await reservationRepository.create({
      reservationNo: 'RSV-2',
      patientId: patient.id,
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: new Date(),
      reservationTime: parseTimeToDate('10:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      patientTypeAtBooking: 'OLD',
      createdBy: 'staff-1',
    });

    const occurredAt = new Date('2026-01-05T03:00:00.000Z').toISOString();
    const useCase = new UpdatePatientTypeOnReservationCreatedUseCase(patientRepository, reservationRepository);
    await useCase.execute({ patientId: patient.id, occurredAt });

    const updated = await patientRepository.findById(patient.id);
    expect(updated?.patientType).toBe('OLD');
    expect(updated?.firstReservationAt?.toISOString()).toBe(occurredAt);
  });

  it('is idempotent: a redelivered event does not re-flip an already-OLD patient or overwrite first_reservation_at', async () => {
    const patientRepository = new FakePatientRepository();
    const reservationRepository = new FakeReservationRepository();
    const patient = await seedPatient(patientRepository);
    const firstFlipAt = new Date('2026-01-05T03:00:00.000Z');
    await patientRepository.markAsReturning(patient.id, firstFlipAt);

    const useCase = new UpdatePatientTypeOnReservationCreatedUseCase(patientRepository, reservationRepository);
    await useCase.execute({ patientId: patient.id, occurredAt: new Date('2026-02-01T00:00:00.000Z').toISOString() });

    const updated = await patientRepository.findById(patient.id);
    expect(updated?.patientType).toBe('OLD');
    expect(updated?.firstReservationAt?.toISOString()).toBe(firstFlipAt.toISOString());
  });
});
