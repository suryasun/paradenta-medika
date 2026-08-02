import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PeriodontalAssessmentLockedException, PeriodontalAssessmentNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IPeriodontalAssessmentRepository } from '../../domain/repositories/IPeriodontalAssessmentRepository';
import { PeriodontalAssessmentResponseDto } from '../dtos/PeriodontalResponseDto';
import { toPeriodontalAssessmentResponseDto } from '../mappers/PeriodontalMapper';

export interface LockPeriodontalAssessmentInput {
  assessmentId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-077.md + docs/03-sad/15-module-emr.md Part 3.2A
 * Section 8: "Pemeriksaan yang telah di-Lock tidak dapat diubah." Once
 * locked, task-073/074 reject further measurement changes.
 */
export class LockPeriodontalAssessmentUseCase {
  constructor(
    private readonly assessmentRepository: IPeriodontalAssessmentRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: LockPeriodontalAssessmentInput): Promise<PeriodontalAssessmentResponseDto> {
    const assessment = await this.assessmentRepository.findById(input.assessmentId);
    if (!assessment) {
      throw new PeriodontalAssessmentNotFoundException();
    }
    if (assessment.status === 'LOCKED') {
      throw new PeriodontalAssessmentLockedException();
    }

    const locked = await this.assessmentRepository.lock(input.assessmentId, input.actorUserId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('PeriodontalAssessment', locked.id, 'UPDATE', { status: assessment.status }, { status: 'LOCKED' }, auditContext);

    return toPeriodontalAssessmentResponseDto(locked);
  }
}
