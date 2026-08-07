import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  InvoiceAlreadyCancelledException,
  InvoiceAlreadyClosedException,
  InvoiceAlreadyVoidException,
  InvoiceNotFoundException,
} from '../../domain/exceptions/BillingExceptions';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { InvoiceSummaryResponseDto } from '../dtos/InvoiceResponseDto';
import { toInvoiceSummaryResponse } from '../mappers/InvoiceMapper';

export interface VoidInvoiceInput {
  invoiceId: string;
  reason: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-325.md: UC-BIL-015 Void Invoice -- the escalation path
 * once Cancel's (task-324) "no payment yet" precondition no longer holds.
 *
 * Resolved design decision (the SAD's UC-BIL-015 doesn't specify ordering):
 * Void does NOT require Payments to be refunded first. It's a single-step
 * action (mandatory reason + audit trail, no separate approval step) that
 * declares the Invoice itself invalid/void, orthogonal to whether money
 * already collected against it is separately given back via Refund
 * (task-326) -- the two are independent corrections, not a required
 * sequence. This mirrors the only two existing "undo a finalized financial
 * record" precedents in this codebase, Finance's VoidJournalUseCase and
 * ReverseJournalUseCase, neither of which has a two-step approval gate.
 *
 * Reachable from UNPAID/PARTIALLY_PAID/PAID. Not reachable from CLOSED
 * (Close's own contract already treats that status as immutable) or an
 * already-CANCELLED/VOID Invoice.
 */
export class VoidInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: VoidInvoiceInput): Promise<InvoiceSummaryResponseDto> {
    const invoice = await this.invoiceRepository.findById(input.invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }
    if (invoice.status === 'VOID') {
      throw new InvoiceAlreadyVoidException();
    }
    if (invoice.status === 'CANCELLED') {
      throw new InvoiceAlreadyCancelledException();
    }
    if (invoice.status === 'CLOSED') {
      throw new InvoiceAlreadyClosedException();
    }

    const voided = await this.invoiceRepository.void(invoice.id, { reason: input.reason, voidedBy: input.actorUserId });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Invoice',
      invoice.id,
      'UPDATE',
      { status: invoice.status },
      { status: 'VOID', reason: input.reason },
      auditContext,
    );

    return toInvoiceSummaryResponse(voided);
  }
}
