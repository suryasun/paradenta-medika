import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { InvalidReservationStatusException, ReservationNotFoundException } from '../../domain/exceptions/ReservationExceptions';
import { RESERVATION_RESCHEDULED_EVENT, ReservationEventPayload } from '../../domain/events/ReservationEvents';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { IReservationTimelineRepository } from '../../domain/repositories/IReservationTimelineRepository';
import { DoctorScheduleValidator } from '../services/DoctorScheduleValidator';
import { parseTimeToDate } from '../services/timeUtils';
import { ReservationResponseDto } from '../dtos/ReservationResponseDto';
import { toReservationResponse } from '../mappers/ReservationMapper';

export interface RescheduleReservationInput {
  reservationId: string;
  reservationDate: string;
  startTime: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-033.md: re-runs the same Doctor Schedule Validation
 * as Create, only allowed before Check-in (docs/03-sad/13-module-reservation.md
 * Section 18.1), and appends a Reservation Timeline entry.
 */
export class RescheduleReservationUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly timelineRepository: IReservationTimelineRepository,
    private readonly scheduleValidator: DoctorScheduleValidator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: RescheduleReservationInput): Promise<ReservationResponseDto> {
    const existing = await this.reservationRepository.findById(input.reservationId);
    if (!existing) {
      throw new ReservationNotFoundException();
    }
    if (existing.status !== 'BOOKED' && existing.status !== 'CONFIRMED') {
      throw new InvalidReservationStatusException('Only a not-yet-checked-in reservation can be rescheduled');
    }

    const reservationDate = new Date(`${input.reservationDate}T00:00:00.000Z`);
    const reservationTime = parseTimeToDate(input.startTime);

    const schedule = await this.scheduleValidator.validate({
      doctorId: existing.doctorId,
      patientId: existing.patientId,
      reservationDate,
      reservationTime,
      excludeReservationId: existing.id,
    });

    const updated = await this.reservationRepository.update(input.reservationId, {
      scheduleId: schedule.id,
      reservationDate,
      reservationTime,
      updatedBy: input.actorUserId,
    });

    await this.timelineRepository.append({
      reservationId: updated.id,
      previousStatus: existing.status,
      newStatus: updated.status,
      note: `Rescheduled to ${input.reservationDate} ${input.startTime}`,
      userId: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Reservation',
      updated.id,
      'UPDATE',
      { reservationDate: existing.reservationDate, reservationTime: existing.reservationTime },
      { reservationDate: updated.reservationDate, reservationTime: updated.reservationTime },
      auditContext,
    );

    const eventPayload: ReservationEventPayload = {
      event: RESERVATION_RESCHEDULED_EVENT,
      reservationId: updated.id,
      reservationNumber: updated.reservationNo,
      patientId: updated.patientId,
      doctorId: updated.doctorId,
      reservationDate: input.reservationDate,
      startTime: input.startTime,
      status: updated.status,
      occurredAt: updated.updatedAt.toISOString(),
    };
    await this.eventBus.publish(RESERVATION_RESCHEDULED_EVENT, eventPayload);

    return toReservationResponse(updated);
  }
}
