import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PAYMENT_REFUNDED_EVENT, PaymentRefundedPayload } from '../../domain/events/BillingEvents';
import {
  InvoiceAlreadyClosedException,
  InvoiceNotFoundException,
  PaymentNotFoundException,
  RefundExceedsPaymentException,
} from '../../domain/exceptions/BillingExceptions';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IPaymentRepository } from '../../domain/repositories/IPaymentRepository';
import { IRefundRepository } from '../../domain/repositories/IRefundRepository';
import { InvoiceSummaryResponseDto } from '../dtos/InvoiceResponseDto';
import { toInvoiceSummaryResponse } from '../mappers/InvoiceMapper';

export interface RefundPaymentInput {
  paymentId: string;
  amount: number;
  reason: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-326.md: UC-BIL-016 Refund Payment, full or partial.
 * "Not already fully refunded" is validated as
 * sum(existing Refund rows for this payment) + amount <= payment.amount --
 * never a cached total, so concurrent partial refunds stay consistent.
 * Refunding moves `Invoice.paidAmount`/`status` backward -- the first place
 * in the codebase this ever happens (every other write to `paidAmount`,
 * CreatePaymentUseCase's, only ever increases it).
 */
export class RefundPaymentUseCase {
  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly paymentRepository: IPaymentRepository,
    private readonly refundRepository: IRefundRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: RefundPaymentInput): Promise<InvoiceSummaryResponseDto> {
    const payment = await this.paymentRepository.findById(input.paymentId);
    if (!payment) {
      throw new PaymentNotFoundException();
    }

    const invoice = await this.invoiceRepository.findById(payment.invoiceId);
    if (!invoice) {
      throw new InvoiceNotFoundException();
    }
    if (invoice.status === 'CLOSED') {
      throw new InvoiceAlreadyClosedException();
    }

    const alreadyRefunded = await this.refundRepository.sumByPaymentId(payment.id);
    const remainingRefundable = Number(payment.amount) - alreadyRefunded;
    if (input.amount > remainingRefundable) {
      throw new RefundExceedsPaymentException();
    }

    const refund = await this.refundRepository.create({
      paymentId: payment.id,
      invoiceId: invoice.id,
      amount: input.amount,
      reason: input.reason,
      approvedBy: input.actorUserId,
      createdBy: input.actorUserId,
    });

    const previousPaidAmount = Number(invoice.paidAmount);
    const newPaidAmount = Math.max(0, previousPaidAmount - input.amount);
    const grandTotal = Number(invoice.grandTotal);
    const newStatus = newPaidAmount <= 0 ? 'UNPAID' : newPaidAmount < grandTotal ? 'PARTIALLY_PAID' : 'PAID';

    const updated = await this.invoiceRepository.updatePayment(invoice.id, {
      paidAmount: newPaidAmount,
      status: newStatus,
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Invoice',
      invoice.id,
      'UPDATE',
      { paidAmount: previousPaidAmount, status: invoice.status },
      { paidAmount: newPaidAmount, status: newStatus, refundId: refund.id, refundAmount: input.amount, reason: input.reason },
      auditContext,
    );

    const eventPayload: PaymentRefundedPayload = {
      event: PAYMENT_REFUNDED_EVENT,
      invoiceId: updated.id,
      invoiceNo: updated.invoiceNo,
      paymentId: payment.id,
      refundId: refund.id,
      refundAmount: input.amount,
      invoiceStatus: newStatus,
      occurredAt: new Date().toISOString(),
    };
    await this.eventBus.publish(PAYMENT_REFUNDED_EVENT, eventPayload);

    return toInvoiceSummaryResponse(updated);
  }
}
