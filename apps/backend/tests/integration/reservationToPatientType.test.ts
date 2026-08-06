import { InMemoryEventBus } from '../../src/shared/events/EventBus';
import { RESERVATION_CREATED_EVENT, ReservationEventPayload } from '../../src/modules/reservation/domain/events/ReservationEvents';
import { CreateReservationUseCase } from '../../src/modules/reservation/application/use-cases/CreateReservationUseCase';
import { DoctorScheduleValidator } from '../../src/modules/reservation/application/services/DoctorScheduleValidator';
import { ReservationNumberGenerator } from '../../src/modules/reservation/application/services/ReservationNumberGenerator';
import { UpdatePatientTypeOnReservationCreatedUseCase } from '../../src/modules/patient/application/use-cases/UpdatePatientTypeOnReservationCreatedUseCase';
import { FakeDoctorRepository } from '../fakes/masterDataFakes';
import { FakeDoctorScheduleRepository, FakeReservationRepository, buildDoctorSchedule } from '../fakes/reservationFakes';
import { FakeAuditService } from '../fakes/authFakes';
import { FakePatientRepository } from '../fakes/patientFakes';

function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date;
}

/**
 * docs/06-tasks/task-290.md: end-to-end proof of the
 * RESERVATION_CREATED_EVENT -> UpdatePatientTypeOnReservationCreatedUseCase
 * wiring (production wiring lives in patient.routes.ts's composition root),
 * following the PATIENT_CHECKED_IN_EVENT -> CreateQueueUseCase precedent in
 * tests/integration/checkInToQueue.test.ts exactly.
 */
describe('Reservation -> Patient Type integration (task-290)', () => {
  it("keeps a patient's own record correctly synced across their first and second real reservation", async () => {
    const eventBus = new InMemoryEventBus();
    const reservationRepository = new FakeReservationRepository();
    const patientRepository = new FakePatientRepository();
    const doctorRepository = new FakeDoctorRepository();
    const scheduleRepository = new FakeDoctorScheduleRepository();
    const auditService = new FakeAuditService();

    const scheduleValidator = new DoctorScheduleValidator(doctorRepository, scheduleRepository, reservationRepository);
    const reservationNumberGenerator = new ReservationNumberGenerator(reservationRepository);
    const createReservationUseCase = new CreateReservationUseCase(
      reservationRepository,
      patientRepository,
      doctorRepository,
      scheduleValidator,
      reservationNumberGenerator,
      auditService,
      eventBus,
    );

    const updatePatientTypeUseCase = new UpdatePatientTypeOnReservationCreatedUseCase(patientRepository, reservationRepository);
    eventBus.subscribe<ReservationEventPayload>(RESERVATION_CREATED_EVENT, async (payload) => {
      await updatePatientTypeUseCase.execute({ patientId: payload.patientId, occurredAt: payload.occurredAt });
    });

    const patient = await patientRepository.create('MRN000001', {
      patientName: 'Jane Doe',
      gender: 'FEMALE',
      birthDate: new Date('1998-08-10'),
      phone: '0812',
      address: 'Jl. Contoh',
    });
    const doctor = await doctorRepository.create({ doctorCode: 'DOC01', userId: 'u1', branchId: 'branch-1', fullName: 'Dr. Test' });
    const monday = nextMonday();
    const nextWeekMonday = new Date(monday);
    nextWeekMonday.setUTCDate(nextWeekMonday.getUTCDate() + 7);
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay(), maxPatient: 5 }));

    await createReservationUseCase.execute({
      patientId: patient.id,
      doctorId: doctor.id,
      reservationDate: monday.toISOString().slice(0, 10),
      startTime: '09:00',
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      actorUserId: 'staff-1',
    });

    const afterFirst = await patientRepository.findById(patient.id);
    expect(afterFirst?.patientType).toBe('NEW');
    expect(afterFirst?.firstReservationAt).toBeNull();

    await createReservationUseCase.execute({
      patientId: patient.id,
      doctorId: doctor.id,
      reservationDate: nextWeekMonday.toISOString().slice(0, 10),
      startTime: '10:00',
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      actorUserId: 'staff-1',
    });

    const afterSecond = await patientRepository.findById(patient.id);
    expect(afterSecond?.patientType).toBe('OLD');
    expect(afterSecond?.firstReservationAt).not.toBeNull();
  });
});
