import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IQueueRepository } from '../../../queue/domain/repositories/IQueueRepository';
import { QueueAlreadyHasVisitException, QueueNotCalledException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { VisitNumberGenerator } from '../services/VisitNumberGenerator';
import { VisitResponseDto } from '../dtos/VisitResponseDto';
import { toVisitResponse } from '../mappers/VisitMapper';

export interface OpenVisitInput {
  queueId: string;
  chiefComplaint?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-048.md + docs/03-sad/15-module-emr.md Section 15
 * Business Rules: Visit only from Queue status CALLED, one Queue = one
 * Visit, must link Doctor/Patient/Branch (all taken from the Queue entry
 * itself, since Queue already carries doctorId/patientId/branchId).
 */
export class OpenVisitUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly queueRepository: IQueueRepository,
    private readonly visitNumberGenerator: VisitNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: OpenVisitInput): Promise<VisitResponseDto> {
    const queue = await this.queueRepository.findById(input.queueId);
    if (!queue || queue.status !== 'CALLED') {
      throw new QueueNotCalledException();
    }

    const existingVisit = await this.visitRepository.findByQueueId(input.queueId);
    if (existingVisit) {
      throw new QueueAlreadyHasVisitException();
    }

    const visitNo = await this.visitNumberGenerator.generate();

    const visit = await this.visitRepository.create({
      visitNo,
      reservationId: queue.reservationId,
      patientId: queue.patientId,
      doctorId: queue.doctorId,
      branchId: queue.branchId,
      queueId: queue.id,
      chiefComplaint: input.chiefComplaint,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Visit', visit.id, 'CREATE', null, { visitNo, queueId: input.queueId }, auditContext);

    return toVisitResponse(visit);
  }
}
