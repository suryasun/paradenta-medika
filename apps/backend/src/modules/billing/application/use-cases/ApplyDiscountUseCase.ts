import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { DiscountExceedsSubtotalException, InvoiceNotFoundException } from '../../domain/exceptions/BillingExceptions';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { assertInvoiceEditable } from '../services/assertInvoiceEditable';
import { InvoiceSummaryResponseDto } from '../dtos/InvoiceResponseDto';
import { toInvoiceSummaryResponse } from '../mappers/InvoiceMapper';

export interface ApplyDiscountInput {
  invoiceId: string;
  amount: number;
  source: string;
  reason: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-322.md: UC-BIL-005 Apply Discount. Extends the existing
 * (previously always-0) `Invoice.discount` field rather than a separate
 * `billing_discounts` table -- the SAD's flow describes a single discount
 * per Invoice, not multiple concurrent ones, so the flat field is the
 * minimal correct model. `grandTotal = subtotal - discount + tax`.
 */
export class ApplyDiscountUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ApplyDiscountInput): Promise<InvoiceSummaryResponseDto> {
    const invoice = await this.invoiceRepository.findById(input.invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }
    assertInvoiceEditable(invoice);

    const subtotal = Number(invoice.subtotal);
    if (input.amount > subtotal) {
      throw new DiscountExceedsSubtotalException();
    }

    const tax = Number(invoice.tax);
    const grandTotal = subtotal - input.amount + tax;

    const updated = await this.invoiceRepository.applyDiscount(invoice.id, {
      discount: input.amount,
      grandTotal,
      discountReason: input.reason,
      discountSource: input.source,
      discountApprovedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Invoice',
      invoice.id,
      'UPDATE',
      { discount: Number(invoice.discount), grandTotal: Number(invoice.grandTotal) },
      { discount: input.amount, grandTotal, source: input.source, reason: input.reason },
      auditContext,
    );

    return toInvoiceSummaryResponse(updated);
  }
}
