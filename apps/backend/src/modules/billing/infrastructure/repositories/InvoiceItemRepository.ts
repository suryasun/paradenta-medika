import { InvoiceItem } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateInvoiceItemInput, IInvoiceItemRepository } from '../../domain/repositories/IInvoiceItemRepository';

export class InvoiceItemRepository implements IInvoiceItemRepository {
  async createMany(inputs: CreateInvoiceItemInput[]): Promise<InvoiceItem[]> {
    if (inputs.length === 0) {
      return [];
    }
    await prisma.invoiceItem.createMany({ data: inputs });
    return this.findByInvoiceId(inputs[0].invoiceId);
  }

  async findByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    return prisma.invoiceItem.findMany({ where: { invoiceId } });
  }
}
