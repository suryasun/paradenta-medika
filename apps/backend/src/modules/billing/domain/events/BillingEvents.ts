// task-057.md Acceptance Criteria: "Publishes PaymentCompleted event
// consumed by Finance/Reporting per docs/03-sad/02-system-architecture.md
// Section 24.1 (Finance module itself is out of Phase 1 scope, but the
// event contract should still be honored for forward compatibility)."
export const PAYMENT_COMPLETED_EVENT = 'PaymentCompleted';

export interface PaymentCompletedPayload {
  event: typeof PAYMENT_COMPLETED_EVENT;
  invoiceId: string;
  invoiceNo: string;
  paymentAmount: number;
  invoiceStatus: string;
  /**
   * docs/06-tasks/task-162.md (Finance, Epic AE): added as a documented
   * extension of this event's original Phase 1 shape, not a contradiction
   * of it -- `CreatePaymentUseCase` can create more than one Payment row
   * per call (Section 10's "Multiple Payment" split, e.g. cash + card in
   * one settlement), and Finance's `RecordBillingPaymentUseCase` needs a
   * stable per-payment reference for idempotent posting plus each line's
   * own `paymentMethodId` (to resolve the account mapping) -- neither of
   * which the original `paymentAmount` total alone can provide.
   */
  paymentIds: string[];
  occurredAt: string;
}

/**
 * docs/06-tasks/task-326.md: UC-BIL-016 Refund Payment. Mirrors
 * PaymentCompletedPayload's shape so Finance's eventual
 * `RecordBillingRefundUseCase` (a Finance-side follow-up, out of this
 * task's scope) can post the reversing journal entry the same way
 * `RecordBillingPaymentUseCase` already does for `PaymentCompleted`.
 */
export const PAYMENT_REFUNDED_EVENT = 'PaymentRefunded';

export interface PaymentRefundedPayload {
  event: typeof PAYMENT_REFUNDED_EVENT;
  invoiceId: string;
  invoiceNo: string;
  paymentId: string;
  refundId: string;
  refundAmount: number;
  invoiceStatus: string;
  occurredAt: string;
}
