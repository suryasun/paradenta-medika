import { Refund } from '@prisma/client';

export interface CreateRefundInput {
  paymentId: string;
  invoiceId: string;
  amount: number;
  reason: string;
  approvedBy?: string;
  createdBy: string;
}

/** docs/06-tasks/task-326.md: UC-BIL-016 Refund Payment. */
export interface IRefundRepository {
  create(input: CreateRefundInput): Promise<Refund>;
  findByPaymentId(paymentId: string): Promise<Refund[]>;
  findByInvoiceId(invoiceId: string): Promise<Refund[]>;
  /** Sum of all Refund rows already recorded against one Payment -- used to validate "not already fully refunded". */
  sumByPaymentId(paymentId: string): Promise<number>;
}
