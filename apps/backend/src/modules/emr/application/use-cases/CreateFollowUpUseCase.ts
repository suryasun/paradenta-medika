import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ValidationException } from '../../../../shared/http/exceptions';
import { CreateReservationUseCase } from '../../../reservation/application/use-cases/CreateReservationUseCase';
import { VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IFollowUpRepository } from '../../domain/repositories/IFollowUpRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { FollowUpPriorityDto } from '../dtos/CreateFollowUpRequestDto';
import { FollowUpResponseDto } from '../dtos/FollowUpResponseDto';
import { toFollowUpResponseDto } from '../mappers/FollowUpMapper';

export interface CreateFollowUpInput {
  visitId: string;
  followUpDate: string;
  note?: string;
  priority?: FollowUpPriorityDto;
  autoSchedule?: boolean;
  doctorId?: string;
  startTime?: string;
  reservationType?: string;
  source?: 'WALK_IN' | 'PHONE' | 'WHATSAPP' | 'WEBSITE' | 'MOBILE_APP';
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-090.md Section 26: "Follow Up dapat membuat
 * Reservation otomatis" -- delegates to Phase 1's CreateReservationUseCase
 * rather than duplicating scheduling logic, mirroring task-064's pattern
 * for Treatment Plan -> Reservation conversion. Reminder delivery is
 * explicitly out of scope ("Reminder dikirim melalui Notification Module
 * (Future)") -- not built here.
 */
export class CreateFollowUpUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly followUpRepository: IFollowUpRepository,
    private readonly createReservationUseCase: CreateReservationUseCase,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateFollowUpInput): Promise<FollowUpResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    let reservationId: string | undefined;
    if (input.autoSchedule) {
      if (!input.doctorId || !input.startTime || !input.reservationType || !input.source) {
        throw new ValidationException([
          { field: 'autoSchedule', message: 'doctorId, startTime, reservationType, and source are required when autoSchedule is true' },
        ]);
      }
      const reservation = await this.createReservationUseCase.execute({
        patientId: visit.patientId,
        doctorId: input.doctorId,
        reservationDate: input.followUpDate,
        startTime: input.startTime,
        reservationType: input.reservationType,
        source: input.source,
        actorUserId: input.actorUserId,
        ipAddress: input.ipAddress,
        correlationId: input.correlationId,
      });
      reservationId = reservation.id;
    }

    const followUp = await this.followUpRepository.create({
      visitId: input.visitId,
      patientId: visit.patientId,
      followUpDate: new Date(`${input.followUpDate}T00:00:00.000Z`),
      note: input.note,
      priority: input.priority,
      reservationId,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'FollowUp',
      followUp.id,
      'CREATE',
      null,
      { visitId: input.visitId, followUpDate: input.followUpDate, reservationId: reservationId ?? null },
      auditContext,
    );

    return toFollowUpResponseDto(followUp);
  }
}
