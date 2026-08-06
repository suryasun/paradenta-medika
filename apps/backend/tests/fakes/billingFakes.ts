import { Invoice, InvoiceItem, Payment, PaymentMethod } from '@prisma/client';
import { CreateInvoiceInput, IInvoiceRepository, ListInvoiceFilter, UpdateInvoicePaymentInput } from '../../src/modules/billing/domain/repositories/IInvoiceRepository';
import { CreateInvoiceItemInput, IInvoiceItemRepository } from '../../src/modules/billing/domain/repositories/IInvoiceItemRepository';
import { CreatePaymentInput, IPaymentRepository } from '../../src/modules/billing/domain/repositories/IPaymentRepository';
import { IPaymentMethodRepository, CreatePaymentMethodInput, UpdatePaymentMethodInput } from '../../src/modules/master-data/domain/repositories/IPaymentMethodRepository';
import { ListQueryDto } from '../../src/shared/http/ListQueryDto';
import { PagedResult } from '../../src/shared/http/pagination';
import { nextFakeUuid } from './uuid';

export class FakeInvoiceRepository implements IInvoiceRepository {
  invoices = new Map<string, Invoice>();

  async create(input: CreateInvoiceInput): Promise<Invoice> {
    const invoice: Invoice = {
      id: nextFakeUuid(),
      invoiceNo: input.invoiceNo,
      visitId: input.visitId,
      patientId: input.patientId,
      branchId: input.branchId,
      invoiceDate: new Date(),
      subtotal: input.subtotal as never,
      discount: input.discount as never,
      tax: input.tax as never,
      grandTotal: input.grandTotal as never,
      paidAmount: 0 as never,
      status: 'UNPAID',
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as Invoice;
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async findById(id: string): Promise<Invoice | null> {
    return this.invoices.get(id) ?? null;
  }

  async findByVisitId(visitId: string): Promise<Invoice | null> {
    return [...this.invoices.values()].find((i) => i.visitId === visitId) ?? null;
  }

  async findByInvoiceNo(invoiceNo: string): Promise<Invoice | null> {
    return [...this.invoices.values()].find((i) => i.invoiceNo === invoiceNo) ?? null;
  }

  async list(query: ListInvoiceFilter): Promise<PagedResult<Invoice>> {
    let items = [...this.invoices.values()];
    if (query.status) items = items.filter((i) => i.status === query.status);
    if (query.patientId) items = items.filter((i) => i.patientId === query.patientId);
    if (query.branchId) items = items.filter((i) => i.branchId === query.branchId);
    const total = items.length;
    const start = (query.page - 1) * query.limit;
    return { items: items.slice(start, start + query.limit), total };
  }

  async countByInvoiceNoPrefix(prefix: string): Promise<number> {
    return [...this.invoices.values()].filter((i) => i.invoiceNo.startsWith(prefix)).length;
  }

  async updatePayment(id: string, input: UpdateInvoicePaymentInput): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error('not found');
    invoice.paidAmount = input.paidAmount as never;
    invoice.status = input.status as never;
    invoice.updatedBy = input.updatedBy;
    return invoice;
  }

  async close(id: string, updatedBy: string): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error('not found');
    invoice.status = 'CLOSED' as never;
    invoice.updatedBy = updatedBy;
    return invoice;
  }

  async sumOutstandingByBranch(branchId: string): Promise<number> {
    return [...this.invoices.values()]
      .filter((i) => i.branchId === branchId && (i.status === 'UNPAID' || i.status === 'PARTIALLY_PAID'))
      .reduce((sum, i) => sum + (Number(i.grandTotal) - Number(i.paidAmount)), 0);
  }
}

export class FakeInvoiceItemRepository implements IInvoiceItemRepository {
  items = new Map<string, InvoiceItem>();

  async createMany(inputs: CreateInvoiceItemInput[]): Promise<InvoiceItem[]> {
    for (const input of inputs) {
      const item: InvoiceItem = {
        id: nextFakeUuid(),
        invoiceId: input.invoiceId,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        itemName: input.itemName,
        quantity: input.quantity as never,
        unitPrice: input.unitPrice as never,
        discount: input.discount as never,
        tax: input.tax as never,
        total: input.total as never,
        createdAt: new Date(),
      } as InvoiceItem;
      this.items.set(item.id, item);
    }
    return this.findByInvoiceId(inputs[0]?.invoiceId ?? '');
  }

  async findByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    return [...this.items.values()].filter((i) => i.invoiceId === invoiceId);
  }
}

export class FakePaymentRepository implements IPaymentRepository {
  payments = new Map<string, Payment>();

  async create(input: CreatePaymentInput): Promise<Payment> {
    const payment: Payment = {
      id: nextFakeUuid(),
      invoiceId: input.invoiceId,
      paymentMethodId: input.paymentMethodId,
      paymentDate: new Date(),
      amount: input.amount as never,
      referenceNo: input.referenceNo ?? null,
      receivedBy: input.receivedBy,
      note: input.note ?? null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as Payment;
    this.payments.set(payment.id, payment);
    return payment;
  }

  async findByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return [...this.payments.values()].filter((p) => p.invoiceId === invoiceId);
  }

  async findById(id: string): Promise<Payment | null> {
    return this.payments.get(id) ?? null;
  }

  // branchId is intentionally unused here: the fake has no Invoice join
  // available (it only stores Payment rows), matching the real
  // PaymentRepository's `invoice: { branchId }` relation filter is not
  // meaningful without seeded Invoice data in this in-memory store.
  async sumAmountForDate(date: Date, _branchId?: string): Promise<number> {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setDate(endOfDay.getDate() + 1);
    return [...this.payments.values()]
      .filter((p) => p.paymentDate >= startOfDay && p.paymentDate < endOfDay)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }
}

export class FakePaymentMethodRepository implements IPaymentMethodRepository {
  methods = new Map<string, PaymentMethod>();

  async create(input: CreatePaymentMethodInput): Promise<PaymentMethod> {
    const method: PaymentMethod = {
      id: nextFakeUuid(),
      methodCode: input.methodCode,
      methodName: input.methodName,
      isCash: input.isCash ?? false,
      isActive: true,
      branchId: input.branchId ?? null,
      createdAt: new Date(),
      createdBy: null,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as PaymentMethod;
    this.methods.set(method.id, method);
    return method;
  }

  async list(query: ListQueryDto): Promise<PagedResult<PaymentMethod>> {
    const all = [...this.methods.values()];
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    return this.methods.get(id) ?? null;
  }

  async findByCode(methodCode: string): Promise<PaymentMethod | null> {
    return [...this.methods.values()].find((m) => m.methodCode === methodCode) ?? null;
  }

  // Phase 4 hardening: same branch-specific-first-else-global fallback as the real repository.
  async findByCodeForBranch(methodCode: string, branchId: string): Promise<PaymentMethod | null> {
    const branchSpecific = [...this.methods.values()].find((m) => m.methodCode === methodCode && m.branchId === branchId);
    if (branchSpecific) return branchSpecific;
    return [...this.methods.values()].find((m) => m.methodCode === methodCode && m.branchId === null) ?? null;
  }

  async existsForBranch(methodCode: string, branchId: string | null): Promise<boolean> {
    return [...this.methods.values()].some((m) => m.methodCode === methodCode && m.branchId === branchId);
  }

  async update(id: string, input: UpdatePaymentMethodInput): Promise<PaymentMethod> {
    const method = this.methods.get(id);
    if (!method) throw new Error('not found');
    Object.assign(method, input);
    return method;
  }
}
