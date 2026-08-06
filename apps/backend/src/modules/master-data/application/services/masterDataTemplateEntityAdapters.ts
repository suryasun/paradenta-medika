import { IMasterDataTemplateEntityAdapter } from './IMasterDataTemplateEntityAdapter';
import { TreatmentTemplateAdapter } from './TreatmentTemplateAdapter';
import { PaymentMethodTemplateAdapter } from './PaymentMethodTemplateAdapter';
import { ToothConditionTemplateAdapter } from './ToothConditionTemplateAdapter';
import { ITreatmentRepository } from '../../domain/repositories/ITreatmentRepository';
import { IPaymentMethodRepository } from '../../domain/repositories/IPaymentMethodRepository';
import { IToothConditionRepository } from '../../domain/repositories/IToothConditionRepository';

/**
 * Phase 4 hardening: entityType is still free text on MasterDataTemplate
 * (unchanged, no validation added there -- see IMasterDataTemplateRepository's
 * own doc comment on why) but a template whose entityType matches one of
 * these three literal keys now actually writes to the real entity, not
 * just the JSON snapshot. Any other entityType keeps behaving exactly as
 * it did before this change.
 */
export function buildMasterDataTemplateEntityAdapterRegistry(
  treatmentRepository: ITreatmentRepository,
  paymentMethodRepository: IPaymentMethodRepository,
  toothConditionRepository: IToothConditionRepository,
): Map<string, IMasterDataTemplateEntityAdapter> {
  return new Map<string, IMasterDataTemplateEntityAdapter>([
    ['TREATMENT', new TreatmentTemplateAdapter(treatmentRepository)],
    ['PAYMENT_METHOD', new PaymentMethodTemplateAdapter(paymentMethodRepository)],
    ['TOOTH_CONDITION', new ToothConditionTemplateAdapter(toothConditionRepository)],
  ]);
}
