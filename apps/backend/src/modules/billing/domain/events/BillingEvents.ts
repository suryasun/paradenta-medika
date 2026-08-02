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
  occurredAt: string;
}
