import { IPaymentMethodRepository } from '../../domain/repositories/IPaymentMethodRepository';
import { MasterDataReferenceInvalidException } from '../../domain/exceptions/MasterDataExceptions';
import { AppliedEntityResult, IMasterDataTemplateEntityAdapter } from './IMasterDataTemplateEntityAdapter';

/** entityType: 'PAYMENT_METHOD' -- see IMasterDataTemplateEntityAdapter's doc comment. */
export class PaymentMethodTemplateAdapter implements IMasterDataTemplateEntityAdapter {
  constructor(private readonly paymentMethodRepository: IPaymentMethodRepository) {}

  async applyToEntity(branchId: string, payload: Record<string, unknown>): Promise<AppliedEntityResult> {
    const methodCode = payload.methodCode as string | undefined;
    if (!methodCode) {
      throw new MasterDataReferenceInvalidException('templatePayload.methodCode is required to apply a PAYMENT_METHOD template');
    }

    const existing = await this.paymentMethodRepository.findByCodeForBranch(methodCode, branchId);
    if (existing && existing.branchId === branchId) {
      const updated = await this.paymentMethodRepository.update(existing.id, {
        methodName: payload.methodName as string | undefined,
        isCash: payload.isCash as boolean | undefined,
      });
      return { created: false, entityId: updated.id };
    }

    const created = await this.paymentMethodRepository.create({
      methodCode,
      methodName: (payload.methodName as string | undefined) ?? existing?.methodName ?? methodCode,
      isCash: (payload.isCash as boolean | undefined) ?? existing?.isCash ?? false,
      branchId,
    });
    return { created: true, entityId: created.id };
  }

  async readEntitySnapshot(_branchId: string, entityId: string): Promise<Record<string, unknown>> {
    const entity = await this.paymentMethodRepository.findById(entityId);
    if (!entity) {
      throw new MasterDataReferenceInvalidException(`Applied PaymentMethod ${entityId} no longer exists`);
    }
    return { methodCode: entity.methodCode, methodName: entity.methodName, isCash: entity.isCash };
  }
}
