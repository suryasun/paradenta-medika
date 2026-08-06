import { IInvoiceRepository } from '../../../billing/domain/repositories/IInvoiceRepository';
import { TreatmentLockedException } from '../../domain/exceptions/EmrExceptions';

/**
 * docs/06-tasks/task-317.md: reads Billing's Invoice status read-only
 * through its own public repository interface (IInvoiceRepository,
 * already existing, already read-only) -- mirrors the precedent already
 * set by RecordTreatmentUseCase's own direct injection of Warehouse's
 * IItemRepository. Consistent with MOD-056 (EMR consumes authorised
 * Billing integration) and does not violate MOD-059 (EMR must not mutate
 * Billing state -- this only reads it).
 */
export async function assertTreatmentEditable(visitId: string, invoiceRepository: IInvoiceRepository): Promise<void> {
  const invoice = await invoiceRepository.findByVisitId(visitId);
  if (invoice?.status === 'PAID') {
    throw new TreatmentLockedException();
  }
}
