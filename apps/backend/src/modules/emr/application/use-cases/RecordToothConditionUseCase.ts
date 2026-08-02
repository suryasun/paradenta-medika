import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IToothConditionRepository } from '../../../master-data/domain/repositories/IToothConditionRepository';
import { MasterDataNotFoundException } from '../../../master-data/domain/exceptions/MasterDataExceptions';
import {
  InvalidSurfaceCombinationException,
  InvalidToothNumberException,
  ToothConditionNotActiveException,
  VisitNotFoundException,
} from '../../domain/exceptions/EmrExceptions';
import { IVisitRepository } from '../../domain/repositories/IVisitRepository';
import { IOdontogramRepository } from '../../domain/repositories/IOdontogramRepository';
import { isValidFdiToothNumber, isValidSurfaceCombination } from '../../domain/services/fdiToothNumbers';
import { assertVisitOpen } from '../services/assertVisitOpen';
import { OdontogramEntryResponseDto } from '../dtos/OdontogramEntryResponseDto';
import { toOdontogramEntryResponseDto } from '../mappers/OdontogramMapper';

export interface RecordToothConditionInput {
  visitId: string;
  toothNumber: number;
  surface?: string;
  toothConditionId: string;
  note?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-068.md + docs/03-sad/15-module-emr.md Part 3.1C Section
 * 24 "Tooth Versioning": "Odontogram tidak pernah diperbarui secara
 * langsung (overwrite)." Every call inserts a new immutable row -- there is
 * no update path, by design (feeds task-069's "current state" query and
 * task-070's history query, both of which read this same append-only log).
 */
export class RecordToothConditionUseCase {
  constructor(
    private readonly visitRepository: IVisitRepository,
    private readonly odontogramRepository: IOdontogramRepository,
    private readonly toothConditionRepository: IToothConditionRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RecordToothConditionInput): Promise<OdontogramEntryResponseDto> {
    const visit = await this.visitRepository.findById(input.visitId);
    if (!visit) {
      throw new VisitNotFoundException();
    }
    assertVisitOpen(visit);

    if (!isValidFdiToothNumber(input.toothNumber)) {
      throw new InvalidToothNumberException();
    }
    if (input.surface !== undefined && !isValidSurfaceCombination(input.surface)) {
      throw new InvalidSurfaceCombinationException();
    }

    const toothCondition = await this.toothConditionRepository.findById(input.toothConditionId);
    if (!toothCondition) {
      throw new MasterDataNotFoundException('ToothCondition');
    }
    if (!toothCondition.isActive) {
      throw new ToothConditionNotActiveException();
    }

    const entry = await this.odontogramRepository.create({
      visitId: input.visitId,
      patientId: visit.patientId,
      toothNumber: input.toothNumber,
      surface: input.surface,
      toothConditionId: input.toothConditionId,
      note: input.note,
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'OdontogramEntry',
      entry.id,
      'CREATE',
      null,
      { patientId: visit.patientId, toothNumber: input.toothNumber, surface: input.surface, toothConditionId: input.toothConditionId },
      auditContext,
    );

    return toOdontogramEntryResponseDto(entry);
  }
}
