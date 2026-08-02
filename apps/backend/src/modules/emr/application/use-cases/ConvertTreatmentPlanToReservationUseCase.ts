import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { CreateReservationUseCase } from '../../../reservation/application/use-cases/CreateReservationUseCase';
import { ReservationResponseDto } from '../../../reservation/application/dtos/ReservationResponseDto';
import { TreatmentPlanItemNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';

export interface ConvertTreatmentPlanToReservationInput {
  treatmentPlanItemId: string;
  doctorId: string;
  reservationDate: string;
  startTime: string;
  reservationType: string;
  source: 'WALK_IN' | 'PHONE' | 'WHATSAPP' | 'WEBSITE' | 'MOBILE_APP';
  complaint?: string;
  notes?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-064.md: "invoke CreateReservationUseCase pre-filled
 * with the patient and planned treatment" -- this delegates to Phase 1's
 * CreateReservationUseCase (which itself runs DoctorScheduleValidator etc.)
 * rather than duplicating reservation-creation/scheduling logic, per
 * docs/03-sad/03-clean-architecture.md module independence rules.
 */
export class ConvertTreatmentPlanToReservationUseCase {
  constructor(
    private readonly treatmentPlanRepository: ITreatmentPlanRepository,
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ConvertTreatmentPlanToReservationInput): Promise<ReservationResponseDto> {
    const planItem = await this.treatmentPlanRepository.findById(input.treatmentPlanItemId);
    if (!planItem) {
      throw new TreatmentPlanItemNotFoundException();
    }

    const reservation = await this.createReservationUseCase.execute({
      patientId: planItem.patientId,
      doctorId: input.doctorId,
      reservationDate: input.reservationDate,
      startTime: input.startTime,
      reservationType: input.reservationType,
      source: input.source,
      complaint: input.complaint,
      notes: input.notes,
      treatmentPlanItemId: planItem.id,
      actorUserId: input.actorUserId,
      ipAddress: input.ipAddress,
      correlationId: input.correlationId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'TreatmentPlanItem',
      planItem.id,
      'UPDATE',
      null,
      { convertedToReservationId: reservation.id },
      auditContext,
    );

    return reservation;
  }
}
