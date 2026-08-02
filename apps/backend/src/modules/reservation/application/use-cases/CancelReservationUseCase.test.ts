import { CancelReservationUseCase } from './CancelReservationUseCase';
import { FakeReservationRepository, FakeReservationTimelineRepository } from '../../../../../tests/fakes/reservationFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import {
  ReservationAlreadyCancelledException,
  ReservationAlreadyCheckedInException,
  ReservationAlreadyCompletedException,
} from '../../domain/exceptions/ReservationExceptions';
import { parseTimeToDate } from '../services/timeUtils';

async function seedReservation(repo: FakeReservationRepository) {
  return repo.create({
    reservationNo: 'RSV-1',
    patientId: 'p1',
    doctorId: 'd1',
    branchId: 'b1',
    reservationDate: new Date(),
    reservationTime: parseTimeToDate('09:00'),
    reservationType: 'APPOINTMENT',
    source: 'PHONE',
    createdBy: 'staff-1',
  });
}

describe('CancelReservationUseCase', () => {
  function buildSut() {
    const reservationRepository = new FakeReservationRepository();
    const timelineRepository = new FakeReservationTimelineRepository();
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const useCase = new CancelReservationUseCase(reservationRepository, timelineRepository, auditService, eventBus);
    return { reservationRepository, timelineRepository, auditService, useCase };
  }

  it('cancels from BOOKED and records the timeline + audit entry', async () => {
    const { reservationRepository, timelineRepository, auditService, useCase } = buildSut();
    const reservation = await seedReservation(reservationRepository);

    const result = await useCase.execute({ reservationId: reservation.id, reason: 'Patient requested', actorUserId: 'staff-1' });

    expect(result.status).toBe('CANCELLED');
    expect(timelineRepository.entries).toHaveLength(1);
    expect(auditService.records).toHaveLength(1);
  });

  it('rejects cancelling an already-checked-in reservation', async () => {
    const { reservationRepository, useCase } = buildSut();
    const reservation = await seedReservation(reservationRepository);
    reservationRepository.reservations.get(reservation.id)!.status = 'CHECK_IN';

    await expect(useCase.execute({ reservationId: reservation.id, reason: 'x', actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      ReservationAlreadyCheckedInException,
    );
  });

  it('rejects cancelling a completed reservation', async () => {
    const { reservationRepository, useCase } = buildSut();
    const reservation = await seedReservation(reservationRepository);
    reservationRepository.reservations.get(reservation.id)!.status = 'COMPLETED';

    await expect(useCase.execute({ reservationId: reservation.id, reason: 'x', actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      ReservationAlreadyCompletedException,
    );
  });

  it('rejects cancelling an already-cancelled reservation', async () => {
    const { reservationRepository, useCase } = buildSut();
    const reservation = await seedReservation(reservationRepository);
    reservationRepository.reservations.get(reservation.id)!.status = 'CANCELLED';

    await expect(useCase.execute({ reservationId: reservation.id, reason: 'x', actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      ReservationAlreadyCancelledException,
    );
  });
});
