import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { ITreatmentRepository } from '../../../master-data/domain/repositories/ITreatmentRepository';
import { MasterDataNotFoundException } from '../../../master-data/domain/exceptions/MasterDataExceptions';
import { ValidationException } from '../../../../shared/http/exceptions';
import { TreatmentNotActiveException, VisitNotFoundException } from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { TreatmentPlanItemEntryDto } from '../dtos/CreateTreatmentPlanRequestDto';
import { TreatmentPlanItemResponseDto } from '../dtos/TreatmentPlanItemResponseDto';
import { toTreatmentPlanItemResponseDto } from '../mappers/TreatmentPlanMapper';

export interface CreateTreatmentPlanInput {
  visitId: string;
  items: TreatmentPlanItemEntryDto[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-063.md: planned future treatment(s), distinct from
 * Phase 1 task-053's "performed now" VisitTreatment entries. Section 22
 * Business Rule "Treatment berasal dari Master Treatment" is enforced the
 * same way task-053 enforces it for VisitTreatment: every item must
 * reference an existing, active Treatment catalog entry.
 */
export class CreateTreatmentPlanUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly treatmentPlanRepository: ITreatmentPlanRepository,
    private readonly treatmentRepository: ITreatmentRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateTreatmentPlanInput): Promise<TreatmentPlanItemResponseDto[]> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    if (input.items.length === 0) {
      throw new ValidationException([{ field: 'items', message: 'At least one Treatment Plan item is required' }]);
    }

    for (const item of input.items) {
      const treatment = await this.treatmentRepository.findById(item.treatmentId);
      if (!treatment) {
        throw new MasterDataNotFoundException('Treatment');
      }
      if (!treatment.isActive) {
        throw new TreatmentNotActiveException();
      }
    }

    const created = await this.treatmentPlanRepository.createMany(
      input.items.map((item) => ({
        visitId: input.visitId,
        patientId: visit.patientId,
        treatmentId: item.treatmentId,
        toothNumber: item.toothNumber,
        surface: item.surface,
        priority: item.priority,
        estimatedCost: item.estimatedCost,
        estimatedDurationMinute: item.estimatedDurationMinute,
        createdBy: input.actorUserId,
      })),
    );

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('TreatmentPlanItem', input.visitId, 'CREATE', null, { count: input.items.length }, auditContext);

    return created.map(toTreatmentPlanItemResponseDto);
  }
}
