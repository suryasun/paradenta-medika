import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IDoctorRepository } from '../../../master-data/domain/repositories/IDoctorRepository';
import { InvalidReservationStatusException, ReservationNotFoundException } from '../../domain/exceptions/ReservationExceptions';
import { RESERVATION_UPDATED_EVENT, ReservationEventPayload } from '../../domain/events/ReservationEvents';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { DoctorScheduleValidator } from '../services/DoctorScheduleValidator';
import { parseTimeToDate } from '../services/timeUtils';
import { ReservationResponseDto } from '../dtos/ReservationResponseDto';
import { toReservationResponse } from '../mappers/ReservationMapper';

export interface UpdateReservationInput {
  reservationId: string;
  doctorId?: string;
  reservationDate?: string;
  startTime?: string;
  reservationType?: string;
  complaint?: string;
  notes?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-032.md: rejects updates once a reservation is
 * IN_SERVICE, COMPLETED, or CANCELLED (docs/03-sad/13-module-reservation.md
 * Section 13.3 additionally blocks CHECK_IN/IN_QUEUE -- only BOOKED/
 * CONFIRMED remain editable).
 */
export class UpdateReservationUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly doctorRepository: IDoctorRepository,
    private readonly scheduleValidator: DoctorScheduleValidator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: UpdateReservationInput): Promise<ReservationResponseDto> {
    const existing = await this.reservationRepository.findById(input.reservationId);
    if (!existing) {
      throw new ReservationNotFoundException();
    }
    if (existing.status !== 'BOOKED' && existing.status !== 'CONFIRMED') {
      throw new InvalidReservationStatusException('Reservation can no longer be updated in its current status');
    }

    const doctorId = input.doctorId ?? existing.doctorId;
    const reservationDate = input.reservationDate ? new Date(`${input.reservationDate}T00:00:00.000Z`) : existing.reservationDate;
    const reservationTime = input.startTime ? parseTimeToDate(input.startTime) : existing.reservationTime;

    let scheduleId = existing.scheduleId;
    let branchId = existing.branchId;
    if (input.doctorId || input.reservationDate || input.startTime) {
      const schedule = await this.scheduleValidator.validate({
        doctorId,
        patientId: existing.patientId,
        reservationDate,
        reservationTime,
        excludeReservationId: existing.id,
      });
      scheduleId = schedule.id;
      const doctor = await this.doctorRepository.findById(doctorId);
      if (doctor) {
        branchId = doctor.branchId;
      }
    }

    const updated = await this.reservationRepository.update(input.reservationId, {
      doctorId,
      branchId,
      scheduleId,
      reservationDate,
      reservationTime,
      reservationType: input.reservationType,
      complaint: input.complaint,
      notes: input.notes,
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Reservation',
      updated.id,
      'UPDATE',
      { doctorId: existing.doctorId, reservationDate: existing.reservationDate, reservationTime: existing.reservationTime },
      { doctorId: updated.doctorId, reservationDate: updated.reservationDate, reservationTime: updated.reservationTime },
      auditContext,
    );

    const eventPayload: ReservationEventPayload = {
      event: RESERVATION_UPDATED_EVENT,
      reservationId: updated.id,
      reservationNumber: updated.reservationNo,
      patientId: updated.patientId,
      doctorId: updated.doctorId,
      reservationDate: updated.reservationDate.toISOString().slice(0, 10),
      startTime: updated.reservationTime.toISOString().slice(11, 16),
      status: updated.status,
      occurredAt: updated.updatedAt.toISOString(),
    };
    await this.eventBus.publish(RESERVATION_UPDATED_EVENT, eventPayload);

    return toReservationResponse(updated);
  }
}
