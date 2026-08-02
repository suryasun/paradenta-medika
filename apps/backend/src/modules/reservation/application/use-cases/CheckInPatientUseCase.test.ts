import { CheckInPatientUseCase } from './CheckInPatientUseCase';
import { FakeReservationRepository, FakeReservationTimelineRepository } from '../../../../../tests/fakes/reservationFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { InvalidReservationStatusException } from '../../domain/exceptions/ReservationExceptions';
import { parseTimeToDate } from '../services/timeUtils';
import { PATIENT_CHECKED_IN_EVENT } from '../../domain/events/ReservationEvents';

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

describe('CheckInPatientUseCase (task-035)', () => {
  function buildSut() {
    const reservationRepository = new FakeReservationRepository();
    const timelineRepository = new FakeReservationTimelineRepository();
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const useCase = new CheckInPatientUseCase(reservationRepository, timelineRepository, auditService, eventBus);
    return { reservationRepository, timelineRepository, eventBus, useCase };
  }

  it('transitions BOOKED -> CHECK_IN and publishes PatientCheckedIn for same-day reservation', async () => {
    const { reservationRepository, eventBus, useCase } = buildSut();
    const reservation = await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: todayUtc(),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });

    const result = await useCase.execute({ reservationId: reservation.id, actorUserId: 'staff-1' });

    expect(result.status).toBe('CHECK_IN');
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0].eventName).toBe(PATIENT_CHECKED_IN_EVENT);
  });

  it('rejects check-in on a date other than the reservation date', async () => {
    const { reservationRepository, useCase } = buildSut();
    const futureDate = new Date(todayUtc().getTime() + 7 * 24 * 60 * 60 * 1000);
    const reservation = await reservationRepository.create({
      reservationNo: 'RSV-2',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: futureDate,
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });

    await expect(useCase.execute({ reservationId: reservation.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      InvalidReservationStatusException,
    );
  });

  it('rejects check-in from an invalid prior status', async () => {
    const { reservationRepository, useCase } = buildSut();
    const reservation = await reservationRepository.create({
      reservationNo: 'RSV-3',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: todayUtc(),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });
    reservationRepository.reservations.get(reservation.id)!.status = 'CANCELLED';

    await expect(useCase.execute({ reservationId: reservation.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      InvalidReservationStatusException,
    );
  });
});
