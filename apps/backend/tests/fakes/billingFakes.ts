import { Invoice, InvoiceItem, InsuranceProvider, Payment, PaymentMethod, Refund } from '@prisma/client';
import {
  ApplyDiscountInput,
  CancelInvoiceInput,
  CreateInvoiceInput,
  IInvoiceRepository,
  ListInvoiceFilter,
  UpdateInvoicePaymentInput,
  UpdateInvoiceTotalsInput,
  VoidInvoiceInput,
} from '../../src/modules/billing/domain/repositories/IInvoiceRepository';
import { CreateInvoiceItemInput, IInvoiceItemRepository, UpdateInvoiceItemInput } from '../../src/modules/billing/domain/repositories/IInvoiceItemRepository';
import { CreatePaymentInput, IPaymentRepository } from '../../src/modules/billing/domain/repositories/IPaymentRepository';
import { CreateRefundInput, IRefundRepository } from '../../src/modules/billing/domain/repositories/IRefundRepository';
import { IPaymentMethodRepository, CreatePaymentMethodInput, UpdatePaymentMethodInput } from '../../src/modules/master-data/domain/repositories/IPaymentMethodRepository';
import {
  IInsuranceProviderRepository,
  CreateInsuranceProviderInput,
  UpdateInsuranceProviderInput,
} from '../../src/modules/master-data/domain/repositories/IInsuranceProviderRepository';
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
      discountReason: null,
      discountSource: null,
      discountApprovedBy: null,
      cancelReason: null,
      cancelledBy: null,
      cancelledAt: null,
      voidReason: null,
      voidedBy: null,
      voidedAt: null,
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

  async updateTotals(id: string, input: UpdateInvoiceTotalsInput): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error('not found');
    invoice.subtotal = input.subtotal as never;
    invoice.grandTotal = input.grandTotal as never;
    invoice.updatedBy = input.updatedBy;
    return invoice;
  }

  async sumOutstandingByBranch(branchId: string): Promise<number> {
    return [...this.invoices.values()]
      .filter((i) => i.branchId === branchId && (i.status === 'UNPAID' || i.status === 'PARTIALLY_PAID'))
      .reduce((sum, i) => sum + (Number(i.grandTotal) - Number(i.paidAmount)), 0);
  }

  async applyDiscount(id: string, input: ApplyDiscountInput): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error('not found');
    invoice.discount = input.discount as never;
    invoice.grandTotal = input.grandTotal as never;
    invoice.discountReason = input.discountReason;
    invoice.discountSource = input.discountSource;
    invoice.discountApprovedBy = input.discountApprovedBy;
    invoice.updatedBy = input.discountApprovedBy;
    return invoice;
  }

  async removeDiscount(id: string, input: { grandTotal: number; updatedBy: string }): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error('not found');
    invoice.discount = 0 as never;
    invoice.grandTotal = input.grandTotal as never;
    invoice.discountReason = null;
    invoice.discountSource = null;
    invoice.discountApprovedBy = null;
    invoice.updatedBy = input.updatedBy;
    return invoice;
  }

  async cancel(id: string, input: CancelInvoiceInput): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error('not found');
    invoice.status = 'CANCELLED' as never;
    invoice.cancelReason = input.reason;
    invoice.cancelledBy = input.cancelledBy;
    invoice.cancelledAt = new Date();
    invoice.updatedBy = input.cancelledBy;
    return invoice;
  }

  async void(id: string, input: VoidInvoiceInput): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) throw new Error('not found');
    invoice.status = 'VOID' as never;
    invoice.voidReason = input.reason;
    invoice.voidedBy = input.voidedBy;
    invoice.voidedAt = new Date();
    invoice.updatedBy = input.voidedBy;
    return invoice;
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
        referenceId: input.referenceId ?? null,
        visitTreatmentId: input.visitTreatmentId ?? null,
        reason: input.reason ?? null,
        itemName: input.itemName,
        quantity: input.quantity as never,
        unitPrice: input.unitPrice as never,
        discount: input.discount as never,
        tax: input.tax as never,
        total: input.total as never,
        createdAt: new Date(),
        updatedAt: null,
        updatedBy: null,
      } as InvoiceItem;
      this.items.set(item.id, item);
    }
    return this.findByInvoiceId(inputs[0]?.invoiceId ?? '');
  }

  async findByInvoiceId(invoiceId: string): Promise<InvoiceItem[]> {
    return [...this.items.values()].filter((i) => i.invoiceId === invoiceId);
  }

  async findByVisitTreatmentId(visitTreatmentId: string): Promise<InvoiceItem | null> {
    return [...this.items.values()].find((i) => i.visitTreatmentId === visitTreatmentId) ?? null;
  }

  async update(id: string, input: UpdateInvoiceItemInput): Promise<InvoiceItem> {
    const item = this.items.get(id);
    if (!item) throw new Error('not found');
    item.itemName = input.itemName;
    item.quantity = input.quantity as never;
    item.unitPrice = input.unitPrice as never;
    item.total = input.total as never;
    item.updatedBy = input.updatedBy;
    item.updatedAt = new Date();
    return item;
  }

  async deleteById(id: string): Promise<void> {
    this.items.delete(id);
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
      payerType: input.payerType ?? 'PATIENT',
      insuranceProviderId: input.insuranceProviderId ?? null,
      policyNumber: input.policyNumber ?? null,
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

export class FakeRefundRepository implements IRefundRepository {
  refunds = new Map<string, Refund>();

  async create(input: CreateRefundInput): Promise<Refund> {
    const refund: Refund = {
      id: nextFakeUuid(),
      paymentId: input.paymentId,
      invoiceId: input.invoiceId,
      amount: input.amount as never,
      reason: input.reason,
      approvedBy: input.approvedBy ?? null,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as Refund;
    this.refunds.set(refund.id, refund);
    return refund;
  }

  async findByPaymentId(paymentId: string): Promise<Refund[]> {
    return [...this.refunds.values()].filter((r) => r.paymentId === paymentId);
  }

  async findByInvoiceId(invoiceId: string): Promise<Refund[]> {
    return [...this.refunds.values()].filter((r) => r.invoiceId === invoiceId);
  }

  async sumByPaymentId(paymentId: string): Promise<number> {
    return (await this.findByPaymentId(paymentId)).reduce((sum, r) => sum + Number(r.amount), 0);
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

// docs/06-tasks/task-332.md: mirrors FakePaymentMethodRepository's shape for
// CreatePaymentUseCase's new payerType='INSURANCE' validation branch.
export class FakeInsuranceProviderRepository implements IInsuranceProviderRepository {
  providers = new Map<string, InsuranceProvider>();

  async create(input: CreateInsuranceProviderInput): Promise<InsuranceProvider> {
    const provider: InsuranceProvider = {
      id: nextFakeUuid(),
      providerName: input.providerName,
      isActive: true,
      createdAt: new Date(),
      createdBy: null,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as InsuranceProvider;
    this.providers.set(provider.id, provider);
    return provider;
  }

  async list(query: ListQueryDto): Promise<PagedResult<InsuranceProvider>> {
    const all = [...this.providers.values()];
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<InsuranceProvider | null> {
    return this.providers.get(id) ?? null;
  }

  async update(id: string, input: UpdateInsuranceProviderInput): Promise<InsuranceProvider> {
    const provider = this.providers.get(id);
    if (!provider) throw new Error('not found');
    Object.assign(provider, input);
    return provider;
  }
}
