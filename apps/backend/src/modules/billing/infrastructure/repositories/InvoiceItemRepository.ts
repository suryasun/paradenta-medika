import { InvoiceItem } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateInvoiceItemInput, IInvoiceItemRepository, UpdateInvoiceItemInput } from '../../domain/repositories/IInvoiceItemRepository';

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

  async findByVisitTreatmentId(visitTreatmentId: string): Promise<InvoiceItem | null> {
    return prisma.invoiceItem.findFirst({ where: { visitTreatmentId } });
  }

  async update(id: string, input: UpdateInvoiceItemInput): Promise<InvoiceItem> {
    return prisma.invoiceItem.update({
      where: { id },
      data: {
        itemName: input.itemName,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        total: input.total,
        updatedBy: input.updatedBy,
      },
    });
  }

  async deleteById(id: string): Promise<void> {
    await prisma.invoiceItem.delete({ where: { id } });
  }
}
