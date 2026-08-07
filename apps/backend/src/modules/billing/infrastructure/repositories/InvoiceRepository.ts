import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  ApplyDiscountInput,
  CancelInvoiceInput,
  CreateInvoiceInput,
  IInvoiceRepository,
  ListInvoiceFilter,
  UpdateInvoicePaymentInput,
  UpdateInvoiceTotalsInput,
  VoidInvoiceInput,
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

  async updateTotals(id: string, input: UpdateInvoiceTotalsInput): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data: {
        subtotal: input.subtotal,
        grandTotal: input.grandTotal,
        updatedBy: input.updatedBy,
      },
    });
  }

  async close(id: string, updatedBy: string): Promise<Invoice> {
    return prisma.invoice.update({ where: { id }, data: { status: 'CLOSED', updatedBy } });
  }

  async applyDiscount(id: string, input: ApplyDiscountInput): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data: {
        discount: input.discount,
        grandTotal: input.grandTotal,
        discountReason: input.discountReason,
        discountSource: input.discountSource,
        discountApprovedBy: input.discountApprovedBy,
        updatedBy: input.discountApprovedBy,
      },
    });
  }

  async removeDiscount(id: string, input: { grandTotal: number; updatedBy: string }): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data: {
        discount: 0,
        grandTotal: input.grandTotal,
        discountReason: null,
        discountSource: null,
        discountApprovedBy: null,
        updatedBy: input.updatedBy,
      },
    });
  }

  async cancel(id: string, input: CancelInvoiceInput): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: input.reason,
        cancelledBy: input.cancelledBy,
        cancelledAt: new Date(),
        updatedBy: input.cancelledBy,
      },
    });
  }

  async void(id: string, input: VoidInvoiceInput): Promise<Invoice> {
    return prisma.invoice.update({
      where: { id },
      data: {
        status: 'VOID',
        voidReason: input.reason,
        voidedBy: input.voidedBy,
        voidedAt: new Date(),
        updatedBy: input.voidedBy,
      },
    });
  }

  async sumOutstandingByBranch(branchId: string): Promise<number> {
    const invoices = await prisma.invoice.findMany({
      where: { branchId, deletedAt: null, status: { in: ['UNPAID', 'PARTIALLY_PAID'] } },
      select: { grandTotal: true, paidAmount: true },
    });
    return invoices.reduce((sum, invoice) => sum + (Number(invoice.grandTotal) - Number(invoice.paidAmount)), 0);
  }
}
