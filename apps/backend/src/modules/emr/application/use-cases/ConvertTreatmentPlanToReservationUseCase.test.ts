import { ConvertTreatmentPlanToReservationUseCase } from './ConvertTreatmentPlanToReservationUseCase';
import { CreateReservationUseCase } from '../../../reservation/application/use-cases/CreateReservationUseCase';
import { DoctorScheduleValidator } from '../../../reservation/application/services/DoctorScheduleValidator';
import { ReservationNumberGenerator } from '../../../reservation/application/services/ReservationNumberGenerator';
import { FakeTreatmentPlanRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeDoctorScheduleRepository, FakeReservationRepository, buildDoctorSchedule } from '../../../../../tests/fakes/reservationFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus, FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { TreatmentPlanItemNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { DoctorScheduleUnavailableException } from '../../../reservation/domain/exceptions/ReservationExceptions';

function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date;
}

function buildSut() {
  const treatmentPlanRepository = new FakeTreatmentPlanRepository();
  const reservationRepository = new FakeReservationRepository();
  const patientRepository = new FakePatientRepository();
  const doctorRepository = new FakeDoctorRepository();
  const scheduleRepository = new FakeDoctorScheduleRepository();
  const scheduleValidator = new DoctorScheduleValidator(doctorRepository, scheduleRepository, reservationRepository);
  const reservationNumberGenerator = new ReservationNumberGenerator(reservationRepository);
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const createReservationUseCase = new CreateReservationUseCase(
    reservationRepository,
    patientRepository,
    doctorRepository,
    scheduleValidator,
    reservationNumberGenerator,
    auditService,
    eventBus,
  );
  const useCase = new ConvertTreatmentPlanToReservationUseCase(treatmentPlanRepository, createReservationUseCase, auditService);
  return { treatmentPlanRepository, patientRepository, doctorRepository, scheduleRepository, reservationRepository, auditService, useCase };
}

describe('ConvertTreatmentPlanToReservationUseCase (task-064)', () => {
  it('rejects converting a non-existent Treatment Plan item', async () => {
    const { useCase } = buildSut();

    await expect(
      useCase.execute({
        treatmentPlanItemId: 'missing',
        doctorId: 'd1',
        reservationDate: '2026-08-10',
        startTime: '09:00',
        reservationType: 'APPOINTMENT',
        source: 'PHONE',
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(TreatmentPlanItemNotFoundException);
  });

  it('produces a Reservation matching the plan item patient, and runs the same Doctor Schedule Validation as any Phase 1 reservation', async () => {
    const { treatmentPlanRepository, patientRepository, doctorRepository, scheduleRepository, useCase } = buildSut();
    const patient = await patientRepository.create('MRN000005', {
      patientName: 'Convert Test Patient',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120003333',
      address: 'Jl. Test No. 5',
    });
    const doctor = await doctorRepository.create({ doctorCode: 'DOC10', userId: 'u10', branchId: 'branch-1', fullName: 'Dr. Convert' });
    const [planItem] = await treatmentPlanRepository.createMany([
      { visitId: 'v1', patientId: patient.id, treatmentId: 't1', estimatedCost: 1200000, createdBy: 'doc-1' },
    ]);
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));

    const reservation = await useCase.execute({
      treatmentPlanItemId: planItem.id,
      doctorId: doctor.id,
      reservationDate: monday.toISOString().slice(0, 10),
      startTime: '09:00',
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      actorUserId: 'staff-1',
    });

    expect(reservation.patientId).toBe(patient.id);
    expect(reservation.doctorId).toBe(doctor.id);
    expect(reservation.status).toBe('BOOKED');
  });

  it('rejects conversion when the chosen doctor/time fails Doctor Schedule Validation (no schedule seeded)', async () => {
    const { treatmentPlanRepository, patientRepository, doctorRepository, useCase } = buildSut();
    const patient = await patientRepository.create('MRN000006', {
      patientName: 'No Schedule Patient',
      gender: 'FEMALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120004444',
      address: 'Jl. Test No. 6',
    });
    const doctor = await doctorRepository.create({ doctorCode: 'DOC11', userId: 'u11', branchId: 'branch-1', fullName: 'Dr. NoSchedule' });
    const [planItem] = await treatmentPlanRepository.createMany([
      { visitId: 'v1', patientId: patient.id, treatmentId: 't1', estimatedCost: 1200000, createdBy: 'doc-1' },
    ]);
    const monday = nextMonday();

    await expect(
      useCase.execute({
        treatmentPlanItemId: planItem.id,
        doctorId: doctor.id,
        reservationDate: monday.toISOString().slice(0, 10),
        startTime: '09:00',
        reservationType: 'APPOINTMENT',
        source: 'PHONE',
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(DoctorScheduleUnavailableException);
  });
});
