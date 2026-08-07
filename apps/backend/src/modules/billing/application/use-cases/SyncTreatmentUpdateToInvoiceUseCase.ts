import { IAuditService } from '../../../system/domain/services/IAuditService';
import { IInvoiceItemRepository } from '../../domain/repositories/IInvoiceItemRepository';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';

export interface SyncTreatmentUpdateToInvoiceInput {
  visitId: string;
  visitTreatmentId: string;
  treatmentName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/**
 * docs/06-tasks/task-321.md: subscribes to `emr.treatment-updated.v1`
 * (published by UpdateTreatmentUseCase) to keep an already-generated
 * Invoice's matching InvoiceItem in sync when a Treatment entry is edited.
 * Same no-op guards as SyncTreatmentToInvoiceUseCase (task-320): no Invoice
 * yet, or Invoice already PAID/CLOSED. Additionally no-ops if no matching
 * InvoiceItem is found by `visitTreatmentId` -- either the Invoice predates
 * this feature (created before the `visitTreatmentId` FK existed) or the
 * item was never synced for some other reason; silently doing nothing is
 * safer than guessing which item to touch.
 */
export class SyncTreatmentUpdateToInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly invoiceItemRepository: IInvoiceItemRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: SyncTreatmentUpdateToInvoiceInput): Promise<void> {
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

    const previousItemTotal = Number(item.total);
    await this.invoiceItemRepository.update(item.id, {
      itemName: input.treatmentName,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      total: input.subtotal,
      updatedBy: 'system:treatment-updated',
    });

    const previousSubtotal = Number(invoice.subtotal);
    const previousGrandTotal = Number(invoice.grandTotal);
    const diff = input.subtotal - previousItemTotal;
    const newSubtotal = previousSubtotal + diff;
    const newGrandTotal = previousGrandTotal + diff;

    await this.invoiceRepository.updateTotals(invoice.id, {
      subtotal: newSubtotal,
      grandTotal: newGrandTotal,
      updatedBy: 'system:treatment-updated',
    });

    await this.auditService.record(
      'Invoice',
      invoice.id,
      'UPDATE',
      { subtotal: previousSubtotal, grandTotal: previousGrandTotal },
      { subtotal: newSubtotal, grandTotal: newGrandTotal, updatedItem: input.treatmentName },
      { userId: 'system:treatment-updated' },
    );
  }
}
