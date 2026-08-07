import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { InvoiceNotFoundException } from '../../domain/exceptions/BillingExceptions';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IInvoiceItemRepository } from '../../domain/repositories/IInvoiceItemRepository';
import { assertInvoiceEditable } from '../services/assertInvoiceEditable';
import { InvoiceSummaryResponseDto } from '../dtos/InvoiceResponseDto';
import { toInvoiceSummaryResponse } from '../mappers/InvoiceMapper';

export interface AddManualChargeInput {
  invoiceId: string;
  itemName: string;
  amount: number;
  reason: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-323.md: UC-BIL-003 Add Manual Charge. Unlike every
 * existing InvoiceItem creation path (Treatment-sourced, via
 * GenerateInvoiceUseCase/SyncTreatmentToInvoiceUseCase), this is the first
 * one triggered directly by Cashier action rather than an EMR event --
 * `referenceType: 'ManualCharge'`, no `referenceId`/`visitTreatmentId`
 * (nothing in EMR/Master Data to point to), mandatory `reason`.
 */
export class AddManualChargeUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly invoiceItemRepository: IInvoiceItemRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: AddManualChargeInput): Promise<InvoiceSummaryResponseDto> {
    const invoice = await this.invoiceRepository.findById(input.invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }
    assertInvoiceEditable(invoice);

    await this.invoiceItemRepository.createMany([
      {
        invoiceId: invoice.id,
        referenceType: 'ManualCharge',
        itemName: input.itemName,
        reason: input.reason,
        quantity: 1,
        unitPrice: input.amount,
        discount: 0,
        tax: 0,
        total: input.amount,
      },
    ]);

    const newSubtotal = Number(invoice.subtotal) + input.amount;
    const newGrandTotal = Number(invoice.grandTotal) + input.amount;
    const updated = await this.invoiceRepository.updateTotals(invoice.id, {
      subtotal: newSubtotal,
      grandTotal: newGrandTotal,
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Invoice',
      invoice.id,
      'UPDATE',
      { subtotal: Number(invoice.subtotal), grandTotal: Number(invoice.grandTotal) },
      { subtotal: newSubtotal, grandTotal: newGrandTotal, addedManualCharge: input.itemName, reason: input.reason },
      auditContext,
    );

    return toInvoiceSummaryResponse(updated);
  }
}
