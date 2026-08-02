import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ValidationException } from '../../../../shared/http/exceptions';
import { VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IPeriodontalAssessmentRepository } from '../../domain/repositories/IPeriodontalAssessmentRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { PeriodontalAssessmentResponseDto } from '../dtos/PeriodontalResponseDto';
import { toPeriodontalAssessmentResponseDto } from '../mappers/PeriodontalMapper';

export interface CreatePeriodontalAssessmentInput {
  visitId: string;
  patientId: string;
  doctorId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-071.md: entry point of periodontal charting, one per examination session. */
export class CreatePeriodontalAssessmentUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly assessmentRepository: IPeriodontalAssessmentRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreatePeriodontalAssessmentInput): Promise<PeriodontalAssessmentResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    if (input.patientId !== visit.patientId) {
      throw new ValidationException([{ field: 'patientId', message: 'patientId does not match the Visit' }]);
    }

    const assessment = await this.assessmentRepository.create({
      visitId: input.visitId,
      patientId: visit.patientId,
      doctorId: input.doctorId,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'PeriodontalAssessment',
      assessment.id,
      'CREATE',
      null,
      { visitId: input.visitId, patientId: visit.patientId, doctorId: input.doctorId },
      auditContext,
    );

    return toPeriodontalAssessmentResponseDto(assessment);
  }
}
