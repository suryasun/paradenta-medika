import { CreateReservationUseCase } from './CreateReservationUseCase';
import { DoctorScheduleValidator } from '../services/DoctorScheduleValidator';
import { ReservationNumberGenerator } from '../services/ReservationNumberGenerator';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeDoctorScheduleRepository, FakeReservationRepository, buildDoctorSchedule } from '../../../../../tests/fakes/reservationFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus, FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { InactivePatientException } from '../../domain/exceptions/ReservationExceptions';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { RESERVATION_CREATED_EVENT } from '../../domain/events/ReservationEvents';

function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date;
}

async function seedPatient(repo: FakePatientRepository, active: boolean) {
  const patient = await repo.create('MRN000001', {
    patientName: 'John Doe',
    gender: 'MALE',
    birthDate: new Date('1998-08-10'),
    phone: '08123456789',
    address: 'Jl. Contoh No. 10',
  });
  if (!active) {
    repo.patients.get(patient.id)!.active = false;
  }
  return patient;
}

function buildSut() {
  const reservationRepository = new FakeReservationRepository();
  const patientRepository = new FakePatientRepository();
  const doctorRepository = new FakeDoctorRepository();
  const scheduleRepository = new FakeDoctorScheduleRepository();
  const scheduleValidator = new DoctorScheduleValidator(doctorRepository, scheduleRepository, reservationRepository);
  const reservationNumberGenerator = new ReservationNumberGenerator(reservationRepository);
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const useCase = new CreateReservationUseCase(
    reservationRepository,
    patientRepository,
    doctorRepository,
    scheduleValidator,
    reservationNumberGenerator,
    auditService,
    eventBus,
  );
  return { reservationRepository, patientRepository, doctorRepository, scheduleRepository, auditService, eventBus, useCase };
}

describe('CreateReservationUseCase', () => {
  it('creates a reservation in BOOKED status, audits, and publishes ReservationCreated', async () => {
    const { patientRepository, doctorRepository, scheduleRepository, auditService, eventBus, useCase } = buildSut();
    const patient = await seedPatient(patientRepository, true);
    const doctor = await doctorRepository.create({ doctorCode: 'DOC01', userId: 'u1', branchId: 'branch-1', fullName: 'Dr. Test' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));

    const result = await useCase.execute({
      patientId: patient.id,
      doctorId: doctor.id,
      reservationDate: monday.toISOString().slice(0, 10),
      startTime: '09:00',
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      actorUserId: 'staff-1',
    });

    expect(result.status).toBe('BOOKED');
    expect(result.reservationNumber).toMatch(/^RSV-\d{8}-0001$/);
    expect(result.branchId).toBe('branch-1');
    expect(auditService.records).toHaveLength(1);
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0].eventName).toBe(RESERVATION_CREATED_EVENT);
  });

  it('rejects booking for a non-existent patient', async () => {
    const { doctorRepository, scheduleRepository, useCase } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC02', userId: 'u2', branchId: 'branch-1', fullName: 'Dr. Test' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));

    await expect(
      useCase.execute({
        patientId: 'missing-patient',
        doctorId: doctor.id,
        reservationDate: monday.toISOString().slice(0, 10),
        startTime: '09:00',
        reservationType: 'APPOINTMENT',
        source: 'PHONE',
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(PatientNotFoundException);
  });

  it('rejects booking for an inactive patient', async () => {
    const { patientRepository, doctorRepository, scheduleRepository, useCase } = buildSut();
    const patient = await seedPatient(patientRepository, false);
    const doctor = await doctorRepository.create({ doctorCode: 'DOC03', userId: 'u3', branchId: 'branch-1', fullName: 'Dr. Test' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));

    await expect(
      useCase.execute({
        patientId: patient.id,
        doctorId: doctor.id,
        reservationDate: monday.toISOString().slice(0, 10),
        startTime: '09:00',
        reservationType: 'APPOINTMENT',
        source: 'PHONE',
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(InactivePatientException);
  });

  // docs/06-tasks/task-290.md Testing Required
  describe('patient_type_at_booking (task-290)', () => {
    it("tags a patient's first reservation NEW", async () => {
      const { patientRepository, doctorRepository, scheduleRepository, useCase } = buildSut();
      const patient = await seedPatient(patientRepository, true);
      const doctor = await doctorRepository.create({ doctorCode: 'DOC04', userId: 'u4', branchId: 'branch-1', fullName: 'Dr. Test' });
      const monday = nextMonday();
      scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay(), maxPatient: 5 }));

      const result = await useCase.execute({
        patientId: patient.id,
        doctorId: doctor.id,
        reservationDate: monday.toISOString().slice(0, 10),
        startTime: '09:00',
        reservationType: 'APPOINTMENT',
        source: 'PHONE',
        actorUserId: 'staff-1',
      });

      expect(result.patientType).toBe('NEW');
    });

    it("tags a patient's second reservation OLD, and does not retroactively change it if the first reservation is cancelled afterward", async () => {
      const { patientRepository, doctorRepository, scheduleRepository, reservationRepository, useCase } = buildSut();
      const patient = await seedPatient(patientRepository, true);
      const doctor = await doctorRepository.create({ doctorCode: 'DOC05', userId: 'u5', branchId: 'branch-1', fullName: 'Dr. Test' });
      const monday = nextMonday();
      const nextWeekMonday = new Date(monday);
      nextWeekMonday.setUTCDate(nextWeekMonday.getUTCDate() + 7);
      scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay(), maxPatient: 5 }));

      const first = await useCase.execute({
        patientId: patient.id,
        doctorId: doctor.id,
        reservationDate: monday.toISOString().slice(0, 10),
        startTime: '09:00',
        reservationType: 'APPOINTMENT',
        source: 'PHONE',
        actorUserId: 'staff-1',
      });
      expect(first.patientType).toBe('NEW');

      const second = await useCase.execute({
        patientId: patient.id,
        doctorId: doctor.id,
        reservationDate: nextWeekMonday.toISOString().slice(0, 10),
        startTime: '10:00',
        reservationType: 'APPOINTMENT',
        source: 'PHONE',
        actorUserId: 'staff-1',
      });
      expect(second.patientType).toBe('OLD');

      // The first reservation is cancelled *after* the second was already
      // computed -- patient_type_at_booking is a permanent snapshot, never
      // recomputed, so the second reservation must remain OLD.
      await reservationRepository.cancel(first.id, 'Patient request', 'staff-1');
      const secondAfterCancel = await reservationRepository.findById(second.id);
      expect(secondAfterCancel?.patientTypeAtBooking).toBe('OLD');
    });
  });
});
