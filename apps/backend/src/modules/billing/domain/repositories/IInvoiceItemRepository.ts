import { InvoiceItem } from '@prisma/client';

export interface CreateInvoiceItemInput {
  invoiceId: string;
  referenceType: string;
  referenceId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
}

export interface IInvoiceItemRepository {
  createMany(inputs: CreateInvoiceItemInput[]): Promise<InvoiceItem[]>;
  findByInvoiceId(invoiceId: string): Promise<InvoiceItem[]>;
}
