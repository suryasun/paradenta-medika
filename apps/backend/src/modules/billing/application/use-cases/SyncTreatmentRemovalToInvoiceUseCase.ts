import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IInvoiceItemRepository } from '../../domain/repositories/IInvoiceItemRepository';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';

export interface SyncTreatmentRemovalToInvoiceInput {
  visitId: string;
  visitTreatmentId: string;
}

/**
 * docs/06-tasks/task-321.md: subscribes to `emr.treatment-removed.v1`
 * (published by RemoveTreatmentUseCase) to remove the matching InvoiceItem
 * from an already-generated Invoice when a Treatment entry is removed. Same
 * no-op guards as SyncTreatmentToInvoiceUseCase/SyncTreatmentUpdateToInvoiceUseCase.
 * Unlike VisitTreatment's own soft delete, the InvoiceItem here is deleted
 * outright -- the Invoice isn't yet a finalized (Paid/Closed) financial
 * record at this point, so there's no "must never physically delete" rule
 * to honor for its line items the way there is for the Invoice itself.
 */
export class SyncTreatmentRemovalToInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly invoiceItemRepository: IInvoiceItemRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: SyncTreatmentRemovalToInvoiceInput): Promise<void> {
    const invoice = await this.invoiceRepository.findByVisitId(input.visitId);
    if (!invoice) {
      return;
    }
    if (invoice.status === 'PAID' || invoice.status === 'CLOSED') {
      return;
    }

    const item = await this.invoiceItemRepository.findByVisitTreatmentId(input.visitTreatmentId);
    if (!item) {
      return;
    }

    await this.invoiceItemRepository.deleteById(item.id);

    const previousSubtotal = Number(invoice.subtotal);
    const previousGrandTotal = Number(invoice.grandTotal);
    const itemTotal = Number(item.total);
    const newSubtotal = previousSubtotal - itemTotal;
    const newGrandTotal = previousGrandTotal - itemTotal;

    await this.invoiceRepository.updateTotals(invoice.id, {
      subtotal: newSubtotal,
      grandTotal: newGrandTotal,
      updatedBy: 'system:treatment-removed',
    });

    await this.auditService.record(
      'Invoice',
      invoice.id,
      'UPDATE',
      { subtotal: previousSubtotal, grandTotal: previousGrandTotal },
      { subtotal: newSubtotal, grandTotal: newGrandTotal, removedItem: item.itemName },
      { userId: 'system:treatment-removed' },
    );
  }
}
