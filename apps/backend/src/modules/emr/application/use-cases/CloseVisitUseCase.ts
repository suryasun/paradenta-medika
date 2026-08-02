import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { MinimumDocumentationException, VisitAlreadyCompletedException, VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { EMR_FINISHED_EVENT, EmrFinishedPayload } from '../../domain/events/EmrEvents';
import { ISoapNoteRepository } from '../../domain/repositories/ISoapNoteRepository';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IVisitTreatmentRepository } from '../../domain/repositories/IVisitTreatmentRepository';
import { VisitResponseDto } from '../dtos/VisitResponseDto';
import { toVisitResponse } from '../mappers/VisitMapper';

export interface CloseVisitInput {
  visitId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-052.md: minimum documentation is a SOAP note and at
 * least one Treatment entry (docs/03-sad/15-module-emr.md Section 16:
 * "SOAP wajib diisi sebelum Visit ditutup"; this task's own text names
 * Treatment as the other minimum requirement). Publishes EMRFinished,
 * which task-054 (Generate Invoice, Epic H) subscribes to.
 */
export class CloseVisitUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly soapNoteRepository: ISoapNoteRepository,
    private readonly visitTreatmentRepository: IVisitTreatmentRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CloseVisitInput): Promise<VisitResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    if (visit.status === 'COMPLETED' || visit.status === 'LOCKED' || visit.status === 'ARCHIVED') {
      throw new VisitAlreadyCompletedException();
    }

    const reasons: string[] = [];
    const soapNote = await this.soapNoteRepository.findByVisitId(input.visitId);
    if (!soapNote || !soapNote.subjective || !soapNote.objective || !soapNote.assessment || !soapNote.plan) {
      reasons.push('a complete SOAP note (Subjective/Objective/Assessment/Plan) is required');
    }
    const treatmentCount = await this.visitTreatmentRepository.countByVisitId(input.visitId);
    if (treatmentCount === 0) {
      reasons.push('at least one Treatment entry is required');
    }
    if (reasons.length > 0) {
      throw new MinimumDocumentationException(reasons);
    }

    const completed = await this.visitRepository.markCompleted(input.visitId, input.actorUserId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Visit', completed.id, 'UPDATE', { status: visit.status }, { status: 'COMPLETED' }, auditContext);

    const eventPayload: EmrFinishedPayload = {
      event: EMR_FINISHED_EVENT,
      visitId: completed.id,
      visitNo: completed.visitNo,
      patientId: completed.patientId,
      doctorId: completed.doctorId,
      branchId: completed.branchId,
      occurredAt: new Date().toISOString(),
    };
    await this.eventBus.publish(EMR_FINISHED_EVENT, eventPayload);

    return toVisitResponse(completed);
  }
}
