import { QuickNewPatientCallUseCase } from './QuickNewPatientCallUseCase';
import { DoctorScheduleValidator } from '../services/DoctorScheduleValidator';
import { MedicalRecordNumberGenerator } from '../../../patient/application/services/MedicalRecordNumberGenerator';
import { ReservationNumberGenerator } from '../services/ReservationNumberGenerator';
import { DuplicateIdentityException } from '../../../patient/domain/exceptions/PatientExceptions';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import {
  FakeDoctorScheduleRepository,
  FakeQuickNewPatientCallRepository,
  FakeReservationRepository,
  buildDoctorSchedule,
} from '../../../../../tests/fakes/reservationFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus, FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { PATIENT_REGISTERED_EVENT } from '../../../patient/domain/events/PatientEvents';
import { RESERVATION_CREATED_EVENT } from '../../domain/events/ReservationEvents';

function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date;
}

function buildSut() {
  const patientRepository = new FakePatientRepository();
  const reservationRepository = new FakeReservationRepository();
  const doctorRepository = new FakeDoctorRepository();
  const scheduleRepository = new FakeDoctorScheduleRepository();
  const scheduleValidator = new DoctorScheduleValidator(doctorRepository, scheduleRepository, reservationRepository);
  const mrnGenerator = new MedicalRecordNumberGenerator(patientRepository);
  const reservationNumberGenerator = new ReservationNumberGenerator(reservationRepository);
  const quickNewPatientCallRepository = new FakeQuickNewPatientCallRepository(patientRepository, reservationRepository);
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const useCase = new QuickNewPatientCallUseCase(
    patientRepository,
    doctorRepository,
    scheduleValidator,
    mrnGenerator,
    reservationNumberGenerator,
    quickNewPatientCallRepository,
    auditService,
    eventBus,
  );
  return { patientRepository, reservationRepository, doctorRepository, scheduleRepository, quickNewPatientCallRepository, auditService, eventBus, useCase };
}

// docs/06-tasks/task-292.md Testing Required
describe('QuickNewPatientCallUseCase', () => {
  it('creates exactly one patient and one reservation, tagged patient_type_at_booking = NEW', async () => {
    const { patientRepository, reservationRepository, doctorRepository, scheduleRepository, auditService, eventBus, useCase } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC01', userId: 'u1', branchId: 'branch-1', fullName: 'Dr. Test' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));

    const result = await useCase.execute({
      fullName: 'Phone Caller',
      address: 'Jl. Contoh No. 5',
      phoneNumber: '081200000001',
      identityNumber: '3171000000009001',
      doctorId: doctor.id,
      reservationDate: monday.toISOString().slice(0, 10),
      startTime: '09:00',
      actorUserId: 'staff-1',
    });

    expect(patientRepository.patients.size).toBe(1);
    expect(reservationRepository.reservations.size).toBe(1);
    expect(result.patientType).toBe('NEW');
    expect(result.status).toBe('BOOKED');
    expect(auditService.records).toHaveLength(2);
    expect(eventBus.published.map((e) => e.eventName)).toEqual(
      expect.arrayContaining([PATIENT_REGISTERED_EVENT, RESERVATION_CREATED_EVENT]),
    );
  });

  it('rolls back the patient creation too when the reservation write fails mid-transaction', async () => {
    const { patientRepository, reservationRepository, doctorRepository, scheduleRepository, quickNewPatientCallRepository, useCase } = buildSut();
    const doctor = await doctorRepository.create({ doctorCode: 'DOC02', userId: 'u2', branchId: 'branch-1', fullName: 'Dr. Test' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));
    quickNewPatientCallRepository.failNextWrite = true;

    await expect(
      useCase.execute({
        fullName: 'Phone Caller',
        address: 'Jl. Contoh No. 6',
        phoneNumber: '081200000002',
        identityNumber: '3171000000009002',
        doctorId: doctor.id,
        reservationDate: monday.toISOString().slice(0, 10),
        startTime: '09:00',
        actorUserId: 'staff-1',
      }),
    ).rejects.toThrow();

    expect(patientRepository.patients.size).toBe(0);
    expect(reservationRepository.reservations.size).toBe(0);
  });

  it('rejects an identityNumber that already belongs to an existing patient, creating neither a new patient nor a reservation', async () => {
    const { patientRepository, reservationRepository, doctorRepository, scheduleRepository, useCase } = buildSut();
    await patientRepository.create('MRN000001', {
      patientName: 'Existing Patient',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      identityType: 'KTP',
      identityNumber: '3171000000009003',
      phone: '0811',
      address: 'Jl. Lama',
    });
    const doctor = await doctorRepository.create({ doctorCode: 'DOC03', userId: 'u3', branchId: 'branch-1', fullName: 'Dr. Test' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));

    await expect(
      useCase.execute({
        fullName: 'Duplicate Caller',
        address: 'Jl. Baru',
        phoneNumber: '081200000003',
        identityNumber: '3171000000009003',
        doctorId: doctor.id,
        reservationDate: monday.toISOString().slice(0, 10),
        startTime: '09:00',
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(DuplicateIdentityException);

    expect(patientRepository.patients.size).toBe(1);
    expect(reservationRepository.reservations.size).toBe(0);
  });
});
