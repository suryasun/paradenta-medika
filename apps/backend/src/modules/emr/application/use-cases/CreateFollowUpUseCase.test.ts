import { CreateFollowUpUseCase } from './CreateFollowUpUseCase';
import { CreateReservationUseCase } from '../../../reservation/application/use-cases/CreateReservationUseCase';
import { DoctorScheduleValidator } from '../../../reservation/application/services/DoctorScheduleValidator';
import { ReservationNumberGenerator } from '../../../reservation/application/services/ReservationNumberGenerator';
import { FakeFollowUpRepository, FakeVisitRepository } from '../../../../../tests/fakes/emrFakes';
import { FakeDoctorRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeDoctorScheduleRepository, FakeReservationRepository, buildDoctorSchedule } from '../../../../../tests/fakes/reservationFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus, FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { ValidationException } from '../../../../shared/http/exceptions';

function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date;
}

async function seedVisit(repo: FakeVisitRepository, patientId: string) {
  return repo.create({ visitNo: 'VIS000001', patientId, doctorId: 'd1', branchId: 'b1', queueId: 'q1', createdBy: 'doc-1' });
}

function buildSut() {
  const visitRepository = new FakeVisitRepository();
  const followUpRepository = new FakeFollowUpRepository();
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
  const useCase = new CreateFollowUpUseCase(visitRepository, followUpRepository, createReservationUseCase, auditService);
  return { visitRepository, followUpRepository, patientRepository, doctorRepository, scheduleRepository, auditService, useCase };
}

describe('CreateFollowUpUseCase (task-090)', () => {
  it('persists a follow-up with date/note/priority when auto-scheduling is not requested, without creating a Reservation', async () => {
    const { visitRepository, followUpRepository, patientRepository, useCase } = buildSut();
    const patient = await patientRepository.create('MRN000007', {
      patientName: 'Follow Up Patient',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120005555',
      address: 'Jl. Test No. 7',
    });
    const visit = await seedVisit(visitRepository, patient.id);

    const followUp = await useCase.execute({
      visitId: visit.id,
      followUpDate: '2026-09-01',
      note: 'Check healing progress',
      priority: 'HIGH' as never,
      actorUserId: 'doc-1',
    });

    expect(followUp.followUpDate).toBe('2026-09-01');
    expect(followUp.note).toBe('Check healing progress');
    expect(followUp.priority).toBe('HIGH');
    expect(followUp.reservationId).toBeNull();
  });

  it('rejects auto-schedule when required booking fields are missing', async () => {
    const { visitRepository, patientRepository, useCase } = buildSut();
    const patient = await patientRepository.create('MRN000008', {
      patientName: 'Auto Schedule Patient',
      gender: 'FEMALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120006666',
      address: 'Jl. Test No. 8',
    });
    const visit = await seedVisit(visitRepository, patient.id);

    await expect(
      useCase.execute({ visitId: visit.id, followUpDate: '2026-09-01', autoSchedule: true, actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it('produces a Reservation passing the same Doctor Schedule Validation as any Phase 1 booking when auto-scheduled', async () => {
    const { visitRepository, followUpRepository, patientRepository, doctorRepository, scheduleRepository, useCase } = buildSut();
    const patient = await patientRepository.create('MRN000009', {
      patientName: 'Scheduled Follow Up Patient',
      gender: 'MALE',
      birthDate: new Date('1990-01-01'),
      phone: '08120007777',
      address: 'Jl. Test No. 9',
    });
    const visit = await seedVisit(visitRepository, patient.id);
    const doctor = await doctorRepository.create({ doctorCode: 'DOC20', userId: 'u20', branchId: 'branch-1', fullName: 'Dr. FollowUp' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));

    const followUp = await useCase.execute({
      visitId: visit.id,
      followUpDate: monday.toISOString().slice(0, 10),
      autoSchedule: true,
      doctorId: doctor.id,
      startTime: '09:00',
      reservationType: 'FOLLOW_UP',
      source: 'PHONE',
      actorUserId: 'doc-1',
    });

    expect(followUp.reservationId).not.toBeNull();
    const stored = await followUpRepository.findByVisitId(visit.id);
    expect(stored[0].reservationId).toBe(followUp.reservationId);
  });
});
