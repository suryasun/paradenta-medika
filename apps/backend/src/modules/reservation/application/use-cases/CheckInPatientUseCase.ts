import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { InvalidReservationStatusException, ReservationNotFoundException } from '../../domain/exceptions/ReservationExceptions';
import { PATIENT_CHECKED_IN_EVENT, PatientCheckedInPayload } from '../../domain/events/ReservationEvents';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { IReservationTimelineRepository } from '../../domain/repositories/IReservationTimelineRepository';
import { ReservationResponseDto } from '../dtos/ReservationResponseDto';
import { toReservationResponse } from '../mappers/ReservationMapper';

export interface CheckInPatientInput {
  reservationId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-035.md: transitions BOOKED -> CHECK_IN and publishes
 * PatientCheckedIn (the Queue module subscribes and creates the Queue
 * entry -- see modules/queue/presentation/routes/queue.routes.ts). Per
 * docs/03-sad/13-module-reservation.md Section 7.3 "Check-in hanya dapat
 * dilakukan pada hari kunjungan" (check-in only allowed on the visit day).
 */
export class CheckInPatientUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly timelineRepository: IReservationTimelineRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CheckInPatientInput): Promise<ReservationResponseDto> {
    const existing = await this.reservationRepository.findById(input.reservationId);
    if (!existing) {
      throw new ReservationNotFoundException();
    }
    if (existing.status !== 'BOOKED' && existing.status !== 'CONFIRMED') {
      throw new InvalidReservationStatusException('Only a booked reservation can be checked in');
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const reservationDay = new Date(existing.reservationDate);
    reservationDay.setUTCHours(0, 0, 0, 0);
    if (reservationDay.getTime() !== today.getTime()) {
      throw new InvalidReservationStatusException('Check-in is only allowed on the reservation date');
    }

    const checkedIn = await this.reservationRepository.checkIn(input.reservationId, input.actorUserId);

    await this.timelineRepository.append({
      reservationId: checkedIn.id,
      previousStatus: existing.status,
      newStatus: checkedIn.status,
      note: 'Patient checked in',
      userId: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Reservation', checkedIn.id, 'UPDATE', { status: existing.status }, { status: 'CHECK_IN' }, auditContext);

    const eventPayload: PatientCheckedInPayload = {
      event: PATIENT_CHECKED_IN_EVENT,
      reservationId: checkedIn.id,
      reservationNumber: checkedIn.reservationNo,
      patientId: checkedIn.patientId,
      doctorId: checkedIn.doctorId,
      branchId: checkedIn.branchId,
      occurredAt: new Date().toISOString(),
    };
    await this.eventBus.publish(PATIENT_CHECKED_IN_EVENT, eventPayload);

    return toReservationResponse(checkedIn);
  }
}
