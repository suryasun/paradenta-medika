import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  InvoiceAlreadyCancelledException,
  InvoiceAlreadyClosedException,
  InvoiceAlreadyVoidException,
  InvoiceHasPaymentException,
  InvoiceNotFoundException,
} from '../../domain/exceptions/BillingExceptions';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { InvoiceSummaryResponseDto } from '../dtos/InvoiceResponseDto';
import { toInvoiceSummaryResponse } from '../mappers/InvoiceMapper';

export interface CancelInvoiceInput {
  invoiceId: string;
  reason: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-324.md: UC-BIL-014 Cancel Invoice -- "Only if no
 * payment yet." Rejects once any payment has been recorded (Void, task-325,
 * is the escalation path for that case) or the Invoice is already
 * CLOSED/CANCELLED/VOID. Mandatory reason + audit trail, per SAD.
 */
export class CancelInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CancelInvoiceInput): Promise<InvoiceSummaryResponseDto> {
    const invoice = await this.invoiceRepository.findById(input.invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }
    if (invoice.status === 'CANCELLED') {
      throw new InvoiceAlreadyCancelledException();
    }
    if (invoice.status === 'VOID') {
      throw new InvoiceAlreadyVoidException();
    }
    if (invoice.status === 'CLOSED') {
      throw new InvoiceAlreadyClosedException();
    }
    if (Number(invoice.paidAmount) > 0) {
      throw new InvoiceHasPaymentException();
    }

    const cancelled = await this.invoiceRepository.cancel(invoice.id, { reason: input.reason, cancelledBy: input.actorUserId });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Invoice',
      invoice.id,
      'UPDATE',
      { status: invoice.status },
      { status: 'CANCELLED', reason: input.reason },
      auditContext,
    );

    return toInvoiceSummaryResponse(cancelled);
  }
}
