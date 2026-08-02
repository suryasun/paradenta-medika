import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  ReservationAlreadyCancelledException,
  ReservationAlreadyCheckedInException,
  ReservationAlreadyCompletedException,
  ReservationNotFoundException,
} from '../../domain/exceptions/ReservationExceptions';
import { RESERVATION_CANCELLED_EVENT, ReservationEventPayload } from '../../domain/events/ReservationEvents';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { IReservationTimelineRepository } from '../../domain/repositories/IReservationTimelineRepository';
import { ReservationResponseDto } from '../dtos/ReservationResponseDto';
import { toReservationResponse } from '../mappers/ReservationMapper';

export interface CancelReservationInput {
  reservationId: string;
  reason: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-034.md + docs/03-sad/13-module-reservation.md Section
 * 18.3: not allowed from IN_SERVICE/COMPLETED, and Section 7.4 additionally
 * blocks a reservation that has already checked in.
 */
export class CancelReservationUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly timelineRepository: IReservationTimelineRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CancelReservationInput): Promise<ReservationResponseDto> {
    const existing = await this.reservationRepository.findById(input.reservationId);
    if (!existing) {
      throw new ReservationNotFoundException();
    }

    if (existing.status === 'CANCELLED') {
      throw new ReservationAlreadyCancelledException();
    }
    if (existing.status === 'COMPLETED') {
      throw new ReservationAlreadyCompletedException();
    }
    if (existing.status === 'CHECK_IN' || existing.status === 'IN_QUEUE' || existing.status === 'IN_SERVICE') {
      throw new ReservationAlreadyCheckedInException();
    }

    const cancelled = await this.reservationRepository.cancel(input.reservationId, input.reason, input.actorUserId);

    await this.timelineRepository.append({
      reservationId: cancelled.id,
      previousStatus: existing.status,
      newStatus: cancelled.status,
      note: input.reason,
      userId: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Reservation',
      cancelled.id,
      'UPDATE',
      { status: existing.status },
      { status: 'CANCELLED', reason: input.reason },
      auditContext,
    );

    const eventPayload: ReservationEventPayload = {
      event: RESERVATION_CANCELLED_EVENT,
      reservationId: cancelled.id,
      reservationNumber: cancelled.reservationNo,
      patientId: cancelled.patientId,
      doctorId: cancelled.doctorId,
      reservationDate: cancelled.reservationDate.toISOString().slice(0, 10),
      startTime: cancelled.reservationTime.toISOString().slice(11, 16),
      status: cancelled.status,
      occurredAt: cancelled.updatedAt.toISOString(),
    };
    await this.eventBus.publish(RESERVATION_CANCELLED_EVENT, eventPayload);

    return toReservationResponse(cancelled);
  }
}
