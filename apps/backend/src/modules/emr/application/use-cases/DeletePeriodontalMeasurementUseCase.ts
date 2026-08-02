import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  PeriodontalAssessmentLockedException,
  PeriodontalAssessmentNotFoundException,
  PeriodontalMeasurementNotFoundException,
} from '../../domain/exceptions/EmrExceptions';
import { IPeriodontalAssessmentRepository } from '../../domain/repositories/IPeriodontalAssessmentRepository';
import { IPeriodontalMeasurementRepository } from '../../domain/repositories/IPeriodontalMeasurementRepository';

export interface DeletePeriodontalMeasurementInput {
  assessmentId: string;
  measurementId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-074.md + docs/03-sad/15-module-emr.md Part 3.2D
 * Section 39's note: "operasi DELETE disarankan sebagai Soft Delete" --
 * same Locked restriction as task-073.
 */
export class DeletePeriodontalMeasurementUseCase {
  constructor(
    private readonly assessmentRepository: IPeriodontalAssessmentRepository,
    private readonly measurementRepository: IPeriodontalMeasurementRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: DeletePeriodontalMeasurementInput): Promise<void> {
    const assessment = await this.assessmentRepository.findById(input.assessmentId);
    if (!assessment) {
      throw new PeriodontalAssessmentNotFoundException();
    }
    if (assessment.status === 'LOCKED') {
      throw new PeriodontalAssessmentLockedException();
    }

    const existing = await this.measurementRepository.findById(input.measurementId);
    if (!existing || existing.assessmentId !== input.assessmentId) {
      throw new PeriodontalMeasurementNotFoundException();
    }

    await this.measurementRepository.softDelete(input.measurementId, input.actorUserId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'PeriodontalMeasurement',
      input.measurementId,
      'DELETE',
      { toothNumber: existing.toothNumber, measurementPoint: existing.measurementPoint },
      null,
      auditContext,
    );
  }
}
