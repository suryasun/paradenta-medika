import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../master-data/domain/repositories/IDoctorRepository';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { DoctorScheduleUnavailableException, InactivePatientException } from '../../domain/exceptions/ReservationExceptions';
import { RESERVATION_CREATED_EVENT, ReservationEventPayload } from '../../domain/events/ReservationEvents';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { ReservationNumberGenerator } from '../services/ReservationNumberGenerator';
import { ReservationResponseDto } from '../dtos/ReservationResponseDto';
import { toReservationResponse } from '../mappers/ReservationMapper';

export interface WalkInRegistrationInput {
  patientId: string;
  doctorId: string;
  complaint?: string;
  notes?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/03-sad/13-module-reservation.md Section 17.3 Business Rules:
 * reservation date defaults to today, reservationType = Walk-in, source =
 * Walk-in. Walk-ins arrive without a pre-booked slot, so this validates
 * doctor/patient active status only -- not the fixed-schedule-window/slot-
 * capacity checks in DoctorScheduleValidator (those apply to Appointment
 * bookings against a published schedule grid, which a walk-in bypasses by
 * definition).
 */
export class WalkInRegistrationUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly patientRepository: IPatientRepository,
    private readonly doctorRepository: IDoctorRepository,
    private readonly reservationNumberGenerator: ReservationNumberGenerator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: WalkInRegistrationInput): Promise<ReservationResponseDto> {
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }
    if (!patient.active) {
      throw new InactivePatientException();
    }

    const doctor = await this.doctorRepository.findById(input.doctorId);
    if (!doctor || !doctor.isActive) {
      throw new DoctorScheduleUnavailableException('Doctor is not active');
    }

    const now = new Date();
    const reservationDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const reservationTime = new Date(Date.UTC(1970, 0, 1, now.getUTCHours(), now.getUTCMinutes()));

    const reservationNo = await this.reservationNumberGenerator.generate(reservationDate);

    // docs/06-tasks/task-290.md: same determination CreateReservationUseCase
    // applies -- a walk-in is just another entry point into reservation
    // creation, not a different rule.
    const priorCount = await this.reservationRepository.countEligibleForPatient(input.patientId);
    const patientTypeAtBooking = priorCount === 0 ? 'NEW' : 'OLD';

    const reservation = await this.reservationRepository.create({
      reservationNo,
      patientId: input.patientId,
      doctorId: input.doctorId,
      branchId: doctor.branchId,
      reservationDate,
      reservationTime,
      reservationType: 'WALK_IN',
      source: 'WALK_IN',
      complaint: input.complaint,
      notes: input.notes,
      patientTypeAtBooking,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Reservation',
      reservation.id,
      'CREATE',
      null,
      { reservationNo, patientId: input.patientId, doctorId: input.doctorId, walkIn: true },
      auditContext,
    );

    const eventPayload: ReservationEventPayload = {
      event: RESERVATION_CREATED_EVENT,
      reservationId: reservation.id,
      reservationNumber: reservation.reservationNo,
      patientId: reservation.patientId,
      doctorId: reservation.doctorId,
      reservationDate: reservationDate.toISOString().slice(0, 10),
      startTime: reservationTime.toISOString().slice(11, 16),
      status: reservation.status,
      occurredAt: reservation.createdAt.toISOString(),
    };
    await this.eventBus.publish(RESERVATION_CREATED_EVENT, eventPayload);

    return toReservationResponse(reservation);
  }
}
