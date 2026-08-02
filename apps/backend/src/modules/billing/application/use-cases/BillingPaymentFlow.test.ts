import { CreatePaymentUseCase } from './CreatePaymentUseCase';
import { CloseInvoiceUseCase } from './CloseInvoiceUseCase';
import { GetInvoiceDetailUseCase } from './GetInvoiceDetailUseCase';
import {
  FakeInvoiceItemRepository,
  FakeInvoiceRepository,
  FakePaymentMethodRepository,
  FakePaymentRepository,
} from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import {
  InvoiceAlreadyClosedException,
  InvoiceNotFullyPaidException,
  PaymentExceedsOutstandingException,
  PaymentMethodNotActiveException,
} from '../../domain/exceptions/BillingExceptions';
import { PAYMENT_COMPLETED_EVENT } from '../../domain/events/BillingEvents';

async function seedInvoice(repo: FakeInvoiceRepository, grandTotal = 400000) {
  return repo.create({
    invoiceNo: 'INV-20260801-000001',
    visitId: 'v1',
    patientId: 'p1',
    branchId: 'b1',
    subtotal: grandTotal,
    discount: 0,
    tax: 0,
    grandTotal,
    createdBy: 'cashier-1',
  });
}

describe('CreatePaymentUseCase (task-057)', () => {
  function buildSut() {
    const invoiceRepository = new FakeInvoiceRepository();
    const paymentRepository = new FakePaymentRepository();
    const paymentMethodRepository = new FakePaymentMethodRepository();
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const useCase = new CreatePaymentUseCase(invoiceRepository, paymentRepository, paymentMethodRepository, auditService, eventBus);
    return { invoiceRepository, paymentRepository, paymentMethodRepository, eventBus, useCase };
  }

  it('a full payment marks the Invoice Paid and publishes PaymentCompleted', async () => {
    const { invoiceRepository, paymentMethodRepository, eventBus, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository, 400000);
    const cash = await paymentMethodRepository.create({ methodCode: 'CASH', methodName: 'Cash' });

    const result = await useCase.execute({
      invoiceId: invoice.id,
      payments: [{ paymentMethodId: cash.id, amount: 400000 }],
      actorUserId: 'cashier-1',
    });

    expect(result.status).toBe('PAID');
    expect(result.outstanding).toBe(0);
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0].eventName).toBe(PAYMENT_COMPLETED_EVENT);
  });

  it('a partial payment marks the Invoice Partially Paid and tracks the remaining balance', async () => {
    const { invoiceRepository, paymentMethodRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository, 400000);
    const cash = await paymentMethodRepository.create({ methodCode: 'CASH', methodName: 'Cash' });

    const result = await useCase.execute({
      invoiceId: invoice.id,
      payments: [{ paymentMethodId: cash.id, amount: 150000 }],
      actorUserId: 'cashier-1',
    });

    expect(result.status).toBe('PARTIALLY_PAID');
    expect(result.paidAmount).toBe(150000);
    expect(result.outstanding).toBe(250000);
  });

  it('supports Multiple Payment (split across methods) summed against the same Invoice', async () => {
    const { invoiceRepository, paymentMethodRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository, 400000);
    const cash = await paymentMethodRepository.create({ methodCode: 'CASH', methodName: 'Cash' });
    const qris = await paymentMethodRepository.create({ methodCode: 'QRIS', methodName: 'QRIS' });

    const result = await useCase.execute({
      invoiceId: invoice.id,
      payments: [
        { paymentMethodId: cash.id, amount: 100000 },
        { paymentMethodId: qris.id, amount: 300000 },
      ],
      actorUserId: 'cashier-1',
    });

    expect(result.status).toBe('PAID');
  });

  it('rejects a payment exceeding the Invoice outstanding balance', async () => {
    const { invoiceRepository, paymentMethodRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository, 400000);
    const cash = await paymentMethodRepository.create({ methodCode: 'CASH', methodName: 'Cash' });

    await expect(
      useCase.execute({ invoiceId: invoice.id, payments: [{ paymentMethodId: cash.id, amount: 500000 }], actorUserId: 'cashier-1' }),
    ).rejects.toBeInstanceOf(PaymentExceedsOutstandingException);
  });

  it('rejects payment against an inactive Payment Method', async () => {
    const { invoiceRepository, paymentMethodRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository, 400000);
    const cash = await paymentMethodRepository.create({ methodCode: 'CASH', methodName: 'Cash' });
    paymentMethodRepository.methods.get(cash.id)!.isActive = false;

    await expect(
      useCase.execute({ invoiceId: invoice.id, payments: [{ paymentMethodId: cash.id, amount: 100000 }], actorUserId: 'cashier-1' }),
    ).rejects.toBeInstanceOf(PaymentMethodNotActiveException);
  });

  it('rejects payment against a Closed Invoice', async () => {
    const { invoiceRepository, paymentMethodRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository, 400000);
    invoiceRepository.invoices.get(invoice.id)!.status = 'CLOSED' as never;
    const cash = await paymentMethodRepository.create({ methodCode: 'CASH', methodName: 'Cash' });

    await expect(
      useCase.execute({ invoiceId: invoice.id, payments: [{ paymentMethodId: cash.id, amount: 100000 }], actorUserId: 'cashier-1' }),
    ).rejects.toBeInstanceOf(InvoiceAlreadyClosedException);
  });
});

describe('CloseInvoiceUseCase (task-058)', () => {
  function buildSut() {
    const invoiceRepository = new FakeInvoiceRepository();
    const auditService = new FakeAuditService();
    const useCase = new CloseInvoiceUseCase(invoiceRepository, auditService);
    return { invoiceRepository, useCase };
  }

  it('rejects closing an unpaid Invoice', async () => {
    const { invoiceRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository);

    await expect(useCase.execute({ invoiceId: invoice.id, actorUserId: 'cashier-1' })).rejects.toBeInstanceOf(InvoiceNotFullyPaidException);
  });

  it('rejects closing a partially-paid Invoice', async () => {
    const { invoiceRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository);
    invoiceRepository.invoices.get(invoice.id)!.status = 'PARTIALLY_PAID' as never;

    await expect(useCase.execute({ invoiceId: invoice.id, actorUserId: 'cashier-1' })).rejects.toBeInstanceOf(InvoiceNotFullyPaidException);
  });

  it('closes a fully-paid Invoice, and a Closed Invoice rejects further close attempts', async () => {
    const { invoiceRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository);
    invoiceRepository.invoices.get(invoice.id)!.status = 'PAID' as never;

    const result = await useCase.execute({ invoiceId: invoice.id, actorUserId: 'cashier-1' });
    expect(result.status).toBe('CLOSED');

    await expect(useCase.execute({ invoiceId: invoice.id, actorUserId: 'cashier-1' })).rejects.toBeInstanceOf(InvoiceAlreadyClosedException);
  });
});

describe('GetInvoiceDetailUseCase (task-056)', () => {
  it('returns 404 for a non-existent Invoice', async () => {
    const invoiceRepository = new FakeInvoiceRepository();
    const useCase = new GetInvoiceDetailUseCase(invoiceRepository, new FakeInvoiceItemRepository(), new FakePaymentRepository());

    await expect(useCase.execute('nonexistent-id')).rejects.toThrow();
  });

  it('detail matches the Invoice totals and recorded items', async () => {
    const invoiceRepository = new FakeInvoiceRepository();
    const invoiceItemRepository = new FakeInvoiceItemRepository();
    const paymentRepository = new FakePaymentRepository();
    const invoice = await seedInvoice(invoiceRepository, 250000);
    await invoiceItemRepository.createMany([
      { invoiceId: invoice.id, referenceType: 'Treatment', referenceId: 't1', itemName: 'Scaling', quantity: 1, unitPrice: 250000, discount: 0, tax: 0, total: 250000 },
    ]);
    const useCase = new GetInvoiceDetailUseCase(invoiceRepository, invoiceItemRepository, paymentRepository);

    const result = await useCase.execute(invoice.id);

    expect(result.grandTotal).toBe(250000);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].itemName).toBe('Scaling');
  });
});
