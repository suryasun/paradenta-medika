import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { IDoctorRepository } from '../../../master-data/domain/repositories/IDoctorRepository';
import { DoctorScheduleUnavailableException, InactivePatientException } from '../../domain/exceptions/ReservationExceptions';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { RESERVATION_CREATED_EVENT, ReservationEventPayload } from '../../domain/events/ReservationEvents';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { DoctorScheduleValidator } from '../services/DoctorScheduleValidator';
import { ReservationNumberGenerator } from '../services/ReservationNumberGenerator';
import { parseTimeToDate } from '../services/timeUtils';
import { ReservationResponseDto } from '../dtos/ReservationResponseDto';
import { toReservationResponse } from '../mappers/ReservationMapper';

export interface CreateReservationInput {
  patientId: string;
  doctorId: string;
  reservationDate: string;
  startTime: string;
  reservationType: string;
  source: 'WALK_IN' | 'PHONE' | 'WHATSAPP' | 'WEBSITE' | 'MOBILE_APP';
  complaint?: string;
  notes?: string;
  /** docs/06-tasks/task-064.md: set when converting a Treatment Plan item to a Reservation. */
  treatmentPlanItemId?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/03-sad/13-module-reservation.md Section 12.5 Process Flow: Select ->
 * Validate Schedule -> Save Reservation -> Generate Reservation Number ->
 * Completed. task-002.md AC: created in BOOKED status.
 */
export class CreateReservationUseCase {
  constructor(
    private readonly reservationRepository: IReservationRepository,
    private readonly patientRepository: IPatientRepository,
    private readonly doctorRepository: IDoctorRepository,
    private readonly scheduleValidator: DoctorScheduleValidator,
    private readonly reservationNumberGenerator: ReservationNumberGenerator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CreateReservationInput): Promise<ReservationResponseDto> {
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }
    if (!patient.active) {
      throw new InactivePatientException();
    }

    const reservationDate = new Date(`${input.reservationDate}T00:00:00.000Z`);
    const reservationTime = parseTimeToDate(input.startTime);

    const schedule = await this.scheduleValidator.validate({
      doctorId: input.doctorId,
      patientId: input.patientId,
      reservationDate,
      reservationTime,
    });

    const doctor = await this.doctorRepository.findById(input.doctorId);
    if (!doctor) {
      // Unreachable in practice: scheduleValidator.validate() above already
      // confirmed the doctor exists and is active.
      throw new DoctorScheduleUnavailableException();
    }

    const reservationNo = await this.reservationNumberGenerator.generate(reservationDate);

    // docs/06-tasks/task-290.md: computed synchronously, before this
    // reservation exists, so it never counts itself -- permanent snapshot,
    // never recomputed after creation.
    const priorCount = await this.reservationRepository.countEligibleForPatient(input.patientId);
    const patientTypeAtBooking = priorCount === 0 ? 'NEW' : 'OLD';

    const reservation = await this.reservationRepository.create({
      reservationNo,
      patientId: input.patientId,
      doctorId: input.doctorId,
      branchId: doctor.branchId,
      scheduleId: schedule.id,
      reservationDate,
      reservationTime,
      reservationType: input.reservationType,
      source: input.source,
      complaint: input.complaint,
      notes: input.notes,
      treatmentPlanItemId: input.treatmentPlanItemId,
      patientTypeAtBooking,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Reservation',
      reservation.id,
      'CREATE',
      null,
      { reservationNo, patientId: input.patientId, doctorId: input.doctorId },
      auditContext,
    );

    const eventPayload: ReservationEventPayload = {
      event: RESERVATION_CREATED_EVENT,
      reservationId: reservation.id,
      reservationNumber: reservation.reservationNo,
      patientId: reservation.patientId,
      doctorId: reservation.doctorId,
      reservationDate: input.reservationDate,
      startTime: input.startTime,
      status: reservation.status,
      occurredAt: reservation.createdAt.toISOString(),
    };
    await this.eventBus.publish(RESERVATION_CREATED_EVENT, eventPayload);

    return toReservationResponse(reservation);
  }
}
