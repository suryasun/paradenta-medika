import { InMemoryEventBus } from '../../src/shared/events/EventBus';
import { PATIENT_CHECKED_IN_EVENT, PatientCheckedInPayload } from '../../src/modules/reservation/domain/events/ReservationEvents';
import { CheckInPatientUseCase } from '../../src/modules/reservation/application/use-cases/CheckInPatientUseCase';
import { CreateQueueUseCase } from '../../src/modules/queue/application/use-cases/CreateQueueUseCase';
import { QueueNumberGenerator } from '../../src/modules/queue/application/services/QueueNumberGenerator';
import { FakeReservationRepository, FakeReservationTimelineRepository } from '../fakes/reservationFakes';
import { FakeQueueRepository } from '../fakes/queueFakes';
import { FakeDoctorRepository } from '../fakes/masterDataFakes';
import { FakePatientRepository } from '../fakes/patientFakes';
import { FakeAuditService } from '../fakes/authFakes';
import { parseTimeToDate } from '../../src/modules/reservation/application/services/timeUtils';

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

describe('Check-In -> Queue integration (task-035 / task-037 seam)', () => {
  it('creates exactly one Queue entry, correctly linked to the reservation, when a patient checks in', async () => {
    const eventBus = new InMemoryEventBus();
    const reservationRepository = new FakeReservationRepository();
    const timelineRepository = new FakeReservationTimelineRepository();
    const queueRepository = new FakeQueueRepository();
    const patientRepository = new FakePatientRepository();
    const doctorRepository = new FakeDoctorRepository();
    const auditService = new FakeAuditService();

    const patient = await patientRepository.create('MRN000001', {
      patientName: 'John Doe',
      gender: 'MALE',
      birthDate: new Date('1998-08-10'),
      phone: '0812',
      address: 'Jl. Contoh',
    });
    const doctor = await doctorRepository.create({ doctorCode: 'DOC01', userId: 'u1', branchId: 'branch-1', fullName: 'Dr. Test' });
    const reservation = await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: patient.id,
      doctorId: doctor.id,
      branchId: doctor.branchId,
      reservationDate: todayUtc(),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });

    const createQueueUseCase = new CreateQueueUseCase(
      queueRepository,
      patientRepository,
      doctorRepository,
      new QueueNumberGenerator(queueRepository),
      auditService,
      eventBus,
    );
    eventBus.subscribe<PatientCheckedInPayload>(PATIENT_CHECKED_IN_EVENT, async (payload) => {
      await createQueueUseCase.execute({
        patientId: payload.patientId,
        doctorId: payload.doctorId,
        reservationId: payload.reservationId,
        actorUserId: 'system:patient-checked-in',
      });
    });

    const checkInUseCase = new CheckInPatientUseCase(reservationRepository, timelineRepository, auditService, eventBus);
    await checkInUseCase.execute({ reservationId: reservation.id, actorUserId: 'staff-1' });

    expect(queueRepository.queues.size).toBe(1);
    const queue = [...queueRepository.queues.values()][0];
    expect(queue.patientId).toBe(patient.id);
    expect(queue.doctorId).toBe(doctor.id);
    expect(queue.reservationId).toBe(reservation.id);
    expect(queue.status).toBe('WAITING');
  });
});
