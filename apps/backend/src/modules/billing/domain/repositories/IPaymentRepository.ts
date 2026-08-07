import { Payment } from '@prisma/client';

export interface CreatePaymentInput {
  invoiceId: string;
  paymentMethodId: string;
  amount: number;
  referenceNo?: string;
  receivedBy: string;
  note?: string;
  createdBy: string;
  /** docs/06-tasks/task-332.md, docs/adr/ADR-001-insurance-coverage-model.md:
   * UC-BIL-006 Apply Insurance, modeled as a payment allocation. Defaults to
   * 'PATIENT' when omitted -- every pre-task-332 Payment line stays 'PATIENT'. */
  payerType?: 'PATIENT' | 'INSURANCE';
  insuranceProviderId?: string;
  policyNumber?: string;
}

export interface IPaymentRepository {
  create(input: CreatePaymentInput): Promise<Payment>;
  findByInvoiceId(invoiceId: string): Promise<Payment[]>;
  findById(id: string): Promise<Payment | null>;
  sumAmountForDate(date: Date, branchId?: string): Promise<number>;
}
