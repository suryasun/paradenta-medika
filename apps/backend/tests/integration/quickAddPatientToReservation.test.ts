import { QuickAddPatientUseCase } from '../../src/modules/patient/application/use-cases/QuickAddPatientUseCase';
import { MedicalRecordNumberGenerator } from '../../src/modules/patient/application/services/MedicalRecordNumberGenerator';
import { CreateReservationUseCase } from '../../src/modules/reservation/application/use-cases/CreateReservationUseCase';
import { DoctorScheduleValidator } from '../../src/modules/reservation/application/services/DoctorScheduleValidator';
import { ReservationNumberGenerator } from '../../src/modules/reservation/application/services/ReservationNumberGenerator';
import { FakeDoctorRepository } from '../fakes/masterDataFakes';
import { FakeDoctorScheduleRepository, FakeReservationRepository, buildDoctorSchedule } from '../fakes/reservationFakes';
import { FakeAuditService } from '../fakes/authFakes';
import { FakeEventBus, FakePatientRepository } from '../fakes/patientFakes';

function nextMonday(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  const daysUntilMonday = (8 - date.getUTCDay()) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date;
}

// task-289 (Epic PE6) AC: "that patient is immediately usable as the
// patientId on a subsequent POST /reservations call". No HTTP-level
// reservation route integration test exists anywhere in this codebase yet
// (unlike Patient's own routes) -- this follows the same use-case-level
// cross-module "integration" convention already established by
// checkInToQueue.test.ts, sharing one FakePatientRepository instance
// across both use cases instead of building a brand-new Express fixture
// for a single AC.
describe('Quick Add Patient -> Reservation integration (task-289)', () => {
  it('creates a quick-add patient with a real MRN, then books a reservation for that patient with no extra profile completion required', async () => {
    const patientRepository = new FakePatientRepository();
    const mrnGenerator = new MedicalRecordNumberGenerator(patientRepository);
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const quickAddUseCase = new QuickAddPatientUseCase(patientRepository, mrnGenerator, auditService, eventBus);

    const patient = await quickAddUseCase.execute({
      fullName: 'Walk-in Patient',
      address: 'Jl. Contoh No. 99',
      phoneNumber: '08129998877',
      identityNumber: '3171000000000001',
      actorUserId: 'staff-1',
    });

    expect(patient.medicalRecordNumber).toBe('MRN000001');
    expect(patient.status).toBe('ACTIVE');

    const reservationRepository = new FakeReservationRepository();
    const doctorRepository = new FakeDoctorRepository();
    const scheduleRepository = new FakeDoctorScheduleRepository();
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

    const doctor = await doctorRepository.create({ doctorCode: 'DOC01', userId: 'u1', branchId: 'branch-1', fullName: 'Dr. Test' });
    const monday = nextMonday();
    scheduleRepository.seed(buildDoctorSchedule({ doctorId: doctor.id, dayOfWeek: monday.getUTCDay() }));

    const reservation = await createReservationUseCase.execute({
      patientId: patient.id,
      doctorId: doctor.id,
      reservationDate: monday.toISOString().slice(0, 10),
      startTime: '09:00',
      reservationType: 'APPOINTMENT',
      source: 'WALK_IN',
      actorUserId: 'staff-1',
    });

    expect(reservation.status).toBe('BOOKED');
    expect(reservation.patientId).toBe(patient.id);
  });

  it('rejects a quick-add request that reuses an already-registered identityNumber', async () => {
    const patientRepository = new FakePatientRepository();
    const mrnGenerator = new MedicalRecordNumberGenerator(patientRepository);
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const quickAddUseCase = new QuickAddPatientUseCase(patientRepository, mrnGenerator, auditService, eventBus);

    await quickAddUseCase.execute({
      fullName: 'First Patient',
      address: 'Jl. Contoh No. 1',
      phoneNumber: '08120000001',
      identityNumber: '3171000000000002',
      actorUserId: 'staff-1',
    });

    await expect(
      quickAddUseCase.execute({
        fullName: 'Duplicate Patient',
        address: 'Jl. Contoh No. 2',
        phoneNumber: '08120000002',
        identityNumber: '3171000000000002',
        actorUserId: 'staff-1',
      }),
    ).rejects.toThrow();
  });
});
