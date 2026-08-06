import { ToothConditionCategory } from '@prisma/client';
import { IToothConditionRepository } from '../../domain/repositories/IToothConditionRepository';
import { MasterDataReferenceInvalidException } from '../../domain/exceptions/MasterDataExceptions';
import { AppliedEntityResult, IMasterDataTemplateEntityAdapter } from './IMasterDataTemplateEntityAdapter';

/** entityType: 'TOOTH_CONDITION' -- see IMasterDataTemplateEntityAdapter's doc comment. */
export class ToothConditionTemplateAdapter implements IMasterDataTemplateEntityAdapter {
  constructor(private readonly toothConditionRepository: IToothConditionRepository) {}

  async applyToEntity(branchId: string, payload: Record<string, unknown>): Promise<AppliedEntityResult> {
    const conditionCode = payload.conditionCode as string | undefined;
    if (!conditionCode) {
      throw new MasterDataReferenceInvalidException('templatePayload.conditionCode is required to apply a TOOTH_CONDITION template');
    }

    const existing = await this.toothConditionRepository.findByCodeForBranch(conditionCode, branchId);
    if (existing && existing.branchId === branchId) {
      const updated = await this.toothConditionRepository.update(existing.id, {
        conditionName: payload.conditionName as string | undefined,
        category: payload.category as ToothConditionCategory | undefined,
        colorCode: payload.colorCode as string | undefined,
      });
      return { created: false, entityId: updated.id };
    }

    const category = (payload.category as ToothConditionCategory | undefined) ?? existing?.category;
    if (!category) {
      throw new MasterDataReferenceInvalidException(
        'templatePayload.category is required to apply a TOOTH_CONDITION template with no existing global ToothCondition to inherit it from',
      );
    }

    const created = await this.toothConditionRepository.create({
      conditionCode,
      conditionName: (payload.conditionName as string | undefined) ?? existing?.conditionName ?? conditionCode,
      category,
      colorCode: (payload.colorCode as string | undefined) ?? existing?.colorCode ?? undefined,
      branchId,
    });
    return { created: true, entityId: created.id };
  }

  async readEntitySnapshot(_branchId: string, entityId: string): Promise<Record<string, unknown>> {
    const entity = await this.toothConditionRepository.findById(entityId);
    if (!entity) {
      throw new MasterDataReferenceInvalidException(`Applied ToothCondition ${entityId} no longer exists`);
    }
    return { conditionCode: entity.conditionCode, conditionName: entity.conditionName, category: entity.category, colorCode: entity.colorCode };
  }
}
