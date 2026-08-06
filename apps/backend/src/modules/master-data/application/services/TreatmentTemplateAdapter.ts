import { ITreatmentRepository } from '../../domain/repositories/ITreatmentRepository';
import { MasterDataReferenceInvalidException } from '../../domain/exceptions/MasterDataExceptions';
import { AppliedEntityResult, IMasterDataTemplateEntityAdapter } from './IMasterDataTemplateEntityAdapter';

// Matches the existing codebase convention for Decimal->number conversion
// (e.g. RecordTreatmentUseCase.ts: `Number(treatment.defaultPrice)`).
function toNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined;
  return Number(value);
}

/** entityType: 'TREATMENT' -- see IMasterDataTemplateEntityAdapter's doc comment. */
export class TreatmentTemplateAdapter implements IMasterDataTemplateEntityAdapter {
  constructor(private readonly treatmentRepository: ITreatmentRepository) {}

  async applyToEntity(branchId: string, payload: Record<string, unknown>): Promise<AppliedEntityResult> {
    const treatmentCode = payload.treatmentCode as string | undefined;
    if (!treatmentCode) {
      throw new MasterDataReferenceInvalidException('templatePayload.treatmentCode is required to apply a TREATMENT template');
    }

    const existing = await this.treatmentRepository.findByCodeForBranch(treatmentCode, branchId);
    if (existing && existing.branchId === branchId) {
      const updated = await this.treatmentRepository.update(existing.id, {
        treatmentName: payload.treatmentName as string | undefined,
        durationMinute: payload.durationMinute as number | undefined,
        defaultPrice: payload.defaultPrice as number | undefined,
        doctorFee: payload.doctorFee as number | undefined,
      });
      return { created: false, entityId: updated.id };
    }

    // `existing` here (if present) is the global fallback row -- reuse its
    // category when the template payload doesn't specify one, so a push
    // customizing only price/duration doesn't need to also restate the
    // category every time.
    const treatmentCategoryId = (payload.treatmentCategoryId as string | undefined) ?? existing?.treatmentCategoryId;
    if (!treatmentCategoryId) {
      throw new MasterDataReferenceInvalidException(
        'templatePayload.treatmentCategoryId is required to apply a TREATMENT template with no existing global Treatment to inherit it from',
      );
    }
    const defaultPrice = toNumber(payload.defaultPrice);
    if (defaultPrice === undefined) {
      throw new MasterDataReferenceInvalidException('templatePayload.defaultPrice is required to apply a TREATMENT template');
    }

    const created = await this.treatmentRepository.create({
      treatmentCode,
      treatmentName: (payload.treatmentName as string | undefined) ?? existing?.treatmentName ?? treatmentCode,
      treatmentCategoryId,
      durationMinute: (payload.durationMinute as number | undefined) ?? toNumber(existing?.durationMinute),
      defaultPrice,
      doctorFee: toNumber(payload.doctorFee) ?? toNumber(existing?.doctorFee),
      branchId,
    });
    return { created: true, entityId: created.id };
  }

  async readEntitySnapshot(_branchId: string, entityId: string): Promise<Record<string, unknown>> {
    const entity = await this.treatmentRepository.findById(entityId);
    if (!entity) {
      throw new MasterDataReferenceInvalidException(`Applied Treatment ${entityId} no longer exists`);
    }
    return {
      treatmentCode: entity.treatmentCode,
      treatmentName: entity.treatmentName,
      treatmentCategoryId: entity.treatmentCategoryId,
      durationMinute: entity.durationMinute,
      defaultPrice: toNumber(entity.defaultPrice),
      doctorFee: toNumber(entity.doctorFee),
    };
  }
}
