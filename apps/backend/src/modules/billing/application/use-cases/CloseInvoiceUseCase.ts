import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { InvoiceAlreadyClosedException, InvoiceNotFoundException, InvoiceNotFullyPaidException } from '../../domain/exceptions/BillingExceptions';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { InvoiceSummaryResponseDto } from '../dtos/InvoiceResponseDto';
import { toInvoiceSummaryResponse } from '../mappers/InvoiceMapper';

export interface CloseInvoiceInput {
  invoiceId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * task-058.md: only a fully-paid Invoice may be Closed; once Closed the
 * Invoice is immutable (docs/01-prd/acceptance-criteria/billing.md: "Invoice
 * Closed tidak dapat dimodifikasi").
 */
export class CloseInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CloseInvoiceInput): Promise<InvoiceSummaryResponseDto> {
    const invoice = await this.invoiceRepository.findById(input.invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }
    if (invoice.status === 'CLOSED') {
      throw new InvoiceAlreadyClosedException();
    }
    if (invoice.status !== 'PAID') {
      throw new InvoiceNotFullyPaidException();
    }

    const closed = await this.invoiceRepository.close(invoice.id, input.actorUserId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Invoice', closed.id, 'UPDATE', { status: invoice.status }, { status: 'CLOSED' }, auditContext);

    return toInvoiceSummaryResponse(closed);
  }
}
