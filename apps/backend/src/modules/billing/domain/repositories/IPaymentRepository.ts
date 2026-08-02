import { Payment } from '@prisma/client';

export interface CreatePaymentInput {
  invoiceId: string;
  paymentMethodId: string;
  amount: number;
  referenceNo?: string;
  receivedBy: string;
  note?: string;
  createdBy: string;
}

export interface IPaymentRepository {
  create(input: CreatePaymentInput): Promise<Payment>;
  findByInvoiceId(invoiceId: string): Promise<Payment[]>;
  findById(id: string): Promise<Payment | null>;
  sumAmountForDate(date: Date, branchId?: string): Promise<number>;
}
