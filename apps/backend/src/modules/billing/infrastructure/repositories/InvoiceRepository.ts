import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateInvoiceInput,
  IInvoiceRepository,
  ListInvoiceFilter,
  UpdateInvoicePaymentInput,
} from '../../domain/repositories/IInvoiceRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'invoiceDate', 'grandTotal'] as const;

export class InvoiceRepository implements IInvoiceRepository {
  async create(input: CreateInvoiceInput): Promise<Invoice> {
    return prisma.invoice.create({
      data: {
        invoiceNo: input.invoiceNo,
        visitId: input.visitId,
        patientId: input.patientId,
        branchId: input.branchId,
        subtotal: input.subtotal,
        discount: input.discount,
        tax: input.tax,
        grandTotal: input.grandTotal,
        createdBy: input.createdBy,
      },
    });
  }

  async findById(id: string): Promise<Invoice | null> {
    return prisma.invoice.findFirst({ where: { id, deletedAt: null } });
  }

  async findByVisitId(visitId: string): Promise<Invoice | null> {
    return prisma.invoice.findFirst({ where: { visitId, deletedAt: null } });
  }

  async findByInvoiceNo(invoiceNo: string): Promise<Invoice | null> {
    return prisma.invoice.findFirst({ where: { invoiceNo } });
  }

  async list(query: ListInvoiceFilter): Promise<PagedResult<Invoice>> {
    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
      ...(query.status ? { status: query.status as InvoiceStatus } : {}),
      ...(query.patientId ? { patientId: query.patientId } : {}),
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            invoiceDate: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.invoice.count({ where }),
    ]);
    return { items, total };
  }

  async countByInvoiceNoPrefix(prefix: string): Promise<number> {
    return prisma.invoice.count({ where: { invoiceNo: { startsWith: prefix } } });
  }

  async updatePayment(id: string, input: UpdateInvoicePaymentInput): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: input.paidAmount,
        status: input.status as InvoiceStatus,
        updatedBy: input.updatedBy,
      },
    });
  }

  async close(id: string, updatedBy: string): Promise<Invoice> {
    return prisma.invoice.update({ where: { id }, data: { status: 'CLOSED', updatedBy } });
  }
}
