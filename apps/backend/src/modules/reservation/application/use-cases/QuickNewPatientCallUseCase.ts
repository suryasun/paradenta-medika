import { randomUUID } from 'crypto';
import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IDoctorRepository } from '../../../master-data/domain/repositories/IDoctorRepository';
import { IReferralSourceRepository } from '../../../master-data/domain/repositories/IReferralSourceRepository';
import { PatientEntity, PatientGenderValue } from '../../../patient/domain/entities/PatientEntity';
import { DuplicateIdentityException, PatientReferralSourceInvalidException } from '../../../patient/domain/exceptions/PatientExceptions';
import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { MedicalRecordNumberGenerator } from '../../../patient/application/services/MedicalRecordNumberGenerator';
import { PATIENT_REGISTERED_EVENT, PatientRegisteredPayload } from '../../../patient/domain/events/PatientEvents';
import { DoctorScheduleUnavailableException } from '../../domain/exceptions/ReservationExceptions';
import { RESERVATION_CREATED_EVENT, ReservationEventPayload } from '../../domain/events/ReservationEvents';
import { IQuickNewPatientCallRepository } from '../../domain/repositories/IQuickNewPatientCallRepository';
import { DoctorScheduleValidator } from '../services/DoctorScheduleValidator';
import { ReservationNumberGenerator } from '../services/ReservationNumberGenerator';
import { parseTimeToDate } from '../services/timeUtils';
import { ReservationResponseDto } from '../dtos/ReservationResponseDto';
import { toReservationResponse } from '../mappers/ReservationMapper';

export interface QuickNewPatientCallInput {
  fullName: string;
  address: string;
  phoneNumber: string;
  identityNumber: string;
  doctorId: string;
  reservationDate: string;
  startTime: string;
  complaint?: string;
  // docs/06-tasks/task-297.md (Reservation Module Addendum #2, R2): same
  // optional pairing as CreatePatientUseCase's -- referredByUserId is
  // accepted but never required server-side even when the selected
  // source has requiresReferrer:true (the client prompts for it).
  referralSourceId?: string;
  referredByUserId?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

// docs/06-tasks/task-289.md / task-292.md: same placeholder convention as
// QuickAddPatientUseCase, since this request contract has no gender/
// dateOfBirth fields either -- correctable afterward via UpdatePatientUseCase.
const QUICK_ADD_PLACEHOLDER_GENDER: PatientGenderValue = 'FEMALE';
const QUICK_ADD_PLACEHOLDER_BIRTH_DATE = new Date('1900-01-01T00:00:00.000Z');
const QUICK_ADD_IDENTITY_TYPE = 'KTP';

/**
 * docs/06-tasks/task-292.md: composes (not duplicates) QuickAddPatientUseCase's
 * patient-creation logic and CreateReservationUseCase's reservation-
 * creation logic. Duplicate-identity check, schedule validation, and
 * number generation all reuse the exact same reads those two use cases
 * perform; only the final combined insert is new (IQuickNewPatientCallRepository),
 * so a failure at either step never leaves an orphaned row behind.
 *
 * By construction, every reservation created through this flow is for a
 * caller not previously in the system, so patient_type_at_booking is always
 * 'NEW' -- there is no prior-reservation count to compute (an unused
 * randomUUID() is passed as the schedule validator's patientId for its
 * same-day-conflict check, which correctly always finds zero matches for a
 * patient that doesn't exist yet).
 */
export class QuickNewPatientCallUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly doctorRepository: IDoctorRepository,
    private readonly scheduleValidator: DoctorScheduleValidator,
    private readonly mrnGenerator: MedicalRecordNumberGenerator,
    private readonly reservationNumberGenerator: ReservationNumberGenerator,
    private readonly quickNewPatientCallRepository: IQuickNewPatientCallRepository,
    private readonly referralSourceRepository: IReferralSourceRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: QuickNewPatientCallInput): Promise<ReservationResponseDto> {
    const existing = await this.patientRepository.findByIdentityNumber(QUICK_ADD_IDENTITY_TYPE, input.identityNumber);
    if (existing) {
      throw new DuplicateIdentityException();
    }

    if (input.referralSourceId) {
      const referralSource = await this.referralSourceRepository.findById(input.referralSourceId);
      if (!referralSource || !referralSource.isActive) {
        throw new PatientReferralSourceInvalidException();
      }
    }

    const reservationDate = new Date(`${input.reservationDate}T00:00:00.000Z`);
    const reservationTime = parseTimeToDate(input.startTime);

    // Validation order unchanged from before MRN scheme hardening
    // (assertDateNotInPast / doctor-active / schedule checks all happen
    // inside validate(), exactly as before) -- only PatientEntity
    // construction moved to after the doctor lookup below, so its
    // registeredBranchId can be set without changing any error precedence.
    const schedule = await this.scheduleValidator.validate({
      doctorId: input.doctorId,
      patientId: randomUUID(),
      reservationDate,
      reservationTime,
    });

    const doctor = await this.doctorRepository.findById(input.doctorId);
    if (!doctor) {
      // Unreachable in practice: scheduleValidator.validate() above already
      // confirmed the doctor exists and is active.
      throw new DoctorScheduleUnavailableException();
    }

    const patientEntity = PatientEntity.create({
      patientName: input.fullName,
      gender: QUICK_ADD_PLACEHOLDER_GENDER,
      birthDate: QUICK_ADD_PLACEHOLDER_BIRTH_DATE,
      identityType: QUICK_ADD_IDENTITY_TYPE,
      identityNumber: input.identityNumber,
      phone: input.phoneNumber,
      address: input.address,
      referralSourceId: input.referralSourceId,
      referredByUserId: input.referredByUserId,
      registeredBranchId: doctor.branchId,
    });

    const medicalRecordNo = await this.mrnGenerator.generate(doctor.branchId);
    const reservationNo = await this.reservationNumberGenerator.generate(reservationDate);

    const { patient, reservation } = await this.quickNewPatientCallRepository.execute({
      medicalRecordNo,
      patientProps: patientEntity.props,
      reservation: {
        reservationNo,
        doctorId: input.doctorId,
        branchId: doctor.branchId,
        scheduleId: schedule.id,
        reservationDate,
        reservationTime,
        reservationType: 'APPOINTMENT',
        source: 'PHONE',
        complaint: input.complaint,
        patientTypeAtBooking: 'NEW',
        createdBy: input.actorUserId,
      },
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Patient',
      patient.id,
      'CREATE',
      null,
      { medicalRecordNo, fullName: input.fullName, source: 'quick-new-patient-call' },
      auditContext,
    );
    await this.auditService.record(
      'Reservation',
      reservation.id,
      'CREATE',
      null,
      { reservationNo, patientId: patient.id, doctorId: input.doctorId, quickCall: true },
      auditContext,
    );

    const patientEventPayload: PatientRegisteredPayload = {
      event: PATIENT_REGISTERED_EVENT,
      patientId: patient.id,
      medicalRecordNumber: patient.medicalRecordNo,
      fullName: patient.patientName,
      registeredAt: patient.createdAt.toISOString(),
    };
    await this.eventBus.publish(PATIENT_REGISTERED_EVENT, patientEventPayload);

    const reservationEventPayload: ReservationEventPayload = {
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
    await this.eventBus.publish(RESERVATION_CREATED_EVENT, reservationEventPayload);

    return toReservationResponse(reservation);
  }
}
