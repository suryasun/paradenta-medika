import { Refund } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateRefundInput, IRefundRepository } from '../../domain/repositories/IRefundRepository';

export class RefundRepository implements IRefundRepository {
  async create(input: CreateRefundInput): Promise<Refund> {
    return prisma.refund.create({
      data: {
        paymentId: input.paymentId,
        invoiceId: input.invoiceId,
        amount: input.amount,
        reason: input.reason,
        approvedBy: input.approvedBy,
        createdBy: input.createdBy,
      },
    });
  }

  async findByPaymentId(paymentId: string): Promise<Refund[]> {
    return prisma.refund.findMany({ where: { paymentId }, orderBy: { createdAt: 'asc' } });
  }

  async findByInvoiceId(invoiceId: string): Promise<Refund[]> {
    return prisma.refund.findMany({ where: { invoiceId }, orderBy: { createdAt: 'asc' } });
  }

  async sumByPaymentId(paymentId: string): Promise<number> {
    const refunds = await prisma.refund.findMany({ where: { paymentId }, select: { amount: true } });
    return refunds.reduce((sum, r) => sum + Number(r.amount), 0);
  }
}
