import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { InvoiceNotFoundException } from '../../domain/exceptions/BillingExceptions';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { assertInvoiceEditable } from '../services/assertInvoiceEditable';
import { InvoiceSummaryResponseDto } from '../dtos/InvoiceResponseDto';
import { toInvoiceSummaryResponse } from '../mappers/InvoiceMapper';

export interface RemoveDiscountInput {
  invoiceId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-322.md: clears an applied discount, restoring `grandTotal = subtotal + tax`. */
export class RemoveDiscountUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: RemoveDiscountInput): Promise<InvoiceSummaryResponseDto> {
    const invoice = await this.invoiceRepository.findById(input.invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }
    assertInvoiceEditable(invoice);

    const grandTotal = Number(invoice.subtotal) + Number(invoice.tax);
    const updated = await this.invoiceRepository.removeDiscount(invoice.id, { grandTotal, updatedBy: input.actorUserId });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Invoice',
      invoice.id,
      'UPDATE',
      { discount: Number(invoice.discount), grandTotal: Number(invoice.grandTotal) },
      { discount: 0, grandTotal },
      auditContext,
    );

    return toInvoiceSummaryResponse(updated);
  }
}
