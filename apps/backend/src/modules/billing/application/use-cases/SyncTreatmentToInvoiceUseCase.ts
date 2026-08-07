import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IInvoiceItemRepository } from '../../domain/repositories/IInvoiceItemRepository';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';

export interface SyncTreatmentToInvoiceInput {
  visitId: string;
  visitTreatmentId: string;
  treatmentId: string;
  treatmentName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/**
 * docs/06-tasks/task-320.md: fixes the gap where a Treatment recorded after
 * Invoice generation (task-316/task-317 relaxed EMR's write-gate so this is
 * now possible while the Invoice is UNPAID/PARTIALLY_PAID) was silently
 * excluded from the Invoice. Subscribes to `emr.treatment-recorded.v1`
 * (published by RecordTreatmentUseCase for every recorded entry, not only
 * post-Invoice ones):
 *
 * - No Invoice exists yet for the visit -> no-op. This is the normal case
 *   (Treatment recorded before Close Visit); GenerateInvoiceUseCase will
 *   snapshot this row itself when the visit is later closed.
 * - Invoice exists but is PAID/CLOSED -> no-op (logged by the caller).
 *   EMR's own assertTreatmentEditable (task-317) already blocks recording a
 *   new Treatment once the Invoice is PAID, but this event is delivered
 *   asynchronously, so a defensive re-check guards the race instead of
 *   corrupting a paid/closed Invoice's totals.
 * - Invoice exists and is UNPAID/PARTIALLY_PAID -> append a matching
 *   InvoiceItem and recalculate subtotal/grandTotal, mirroring exactly the
 *   item shape GenerateInvoiceUseCase itself produces.
 */
export class SyncTreatmentToInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly invoiceItemRepository: IInvoiceItemRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: SyncTreatmentToInvoiceInput): Promise<void> {
    const invoice = await this.invoiceRepository.findByVisitId(input.visitId);
    if (!invoice) {
      return;
    }
    if (invoice.status === 'PAID' || invoice.status === 'CLOSED') {
      return;
    }

    await this.invoiceItemRepository.createMany([
      {
        invoiceId: invoice.id,
        referenceType: 'Treatment',
        referenceId: input.treatmentId,
        visitTreatmentId: input.visitTreatmentId,
        itemName: input.treatmentName,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        discount: 0,
        tax: 0,
        total: input.subtotal,
      },
    ]);

    const previousSubtotal = Number(invoice.subtotal);
    const previousGrandTotal = Number(invoice.grandTotal);
    const newSubtotal = previousSubtotal + input.subtotal;
    const newGrandTotal = previousGrandTotal + input.subtotal;

    await this.invoiceRepository.updateTotals(invoice.id, {
      subtotal: newSubtotal,
      grandTotal: newGrandTotal,
      updatedBy: 'system:treatment-recorded',
    });

    await this.auditService.record(
      'Invoice',
      invoice.id,
      'UPDATE',
      { subtotal: previousSubtotal, grandTotal: previousGrandTotal },
      { subtotal: newSubtotal, grandTotal: newGrandTotal, addedItem: input.treatmentName },
      { userId: 'system:treatment-recorded' },
    );
  }
}
