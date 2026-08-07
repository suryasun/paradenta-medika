import { Payment } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreatePaymentInput, IPaymentRepository } from '../../domain/repositories/IPaymentRepository';

export class PaymentRepository implements IPaymentRepository {
  async create(input: CreatePaymentInput): Promise<Payment> {
    return prisma.payment.create({
      data: {
        invoiceId: input.invoiceId,
        paymentMethodId: input.paymentMethodId,
        amount: input.amount,
        referenceNo: input.referenceNo,
        receivedBy: input.receivedBy,
        note: input.note,
        createdBy: input.createdBy,
        payerType: input.payerType ?? 'PATIENT',
        insuranceProviderId: input.insuranceProviderId,
        policyNumber: input.policyNumber,
      },
    });
  }

  async findByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return prisma.payment.findMany({ where: { invoiceId, deletedAt: null } });
  }

  async findById(id: string): Promise<Payment | null> {
    return prisma.payment.findFirst({ where: { id, deletedAt: null } });
  }

  async sumAmountForDate(date: Date, branchId?: string): Promise<number> {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const result = await prisma.payment.aggregate({
      where: {
        deletedAt: null,
        paymentDate: { gte: startOfDay, lt: endOfDay },
        ...(branchId ? { invoice: { branchId } } : {}),
      },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }
}
