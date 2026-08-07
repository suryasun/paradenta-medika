import { RefundPaymentUseCase } from './RefundPaymentUseCase';
import { FakeInvoiceRepository, FakePaymentRepository, FakeRefundRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { InvoiceAlreadyClosedException, RefundExceedsPaymentException } from '../../domain/exceptions/BillingExceptions';
import { PAYMENT_REFUNDED_EVENT } from '../../domain/events/BillingEvents';

function buildSut() {
  const invoiceRepository = new FakeInvoiceRepository();
  const paymentRepository = new FakePaymentRepository();
  const refundRepository = new FakeRefundRepository();
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const useCase = new RefundPaymentUseCase(invoiceRepository, paymentRepository, refundRepository, auditService, eventBus);
  return { invoiceRepository, paymentRepository, refundRepository, eventBus, useCase };
}

async function seedPaidInvoice(invoiceRepository: FakeInvoiceRepository, paymentRepository: FakePaymentRepository, amount = 400000) {
  const invoice = await invoiceRepository.create({ invoiceNo: 'INV1', visitId: 'v1', patientId: 'p1', branchId: 'b1', subtotal: amount, discount: 0, tax: 0, grandTotal: amount, createdBy: 'admin' });
  invoiceRepository.invoices.get(invoice.id)!.status = 'PAID' as never;
  invoiceRepository.invoices.get(invoice.id)!.paidAmount = amount as never;
  const payment = await paymentRepository.create({ invoiceId: invoice.id, paymentMethodId: 'pm1', amount, receivedBy: 'cashier-1', createdBy: 'cashier-1' });
  return { invoice, payment };
}

// docs/06-tasks/task-326.md
describe('RefundPaymentUseCase', () => {
  it('fully refunds a payment, moving the Invoice back to UNPAID', async () => {
    const { invoiceRepository, paymentRepository, useCase } = buildSut();
    const { invoice, payment } = await seedPaidInvoice(invoiceRepository, paymentRepository, 400000);

    const result = await useCase.execute({ paymentId: payment.id, amount: 400000, reason: 'Overcharged', actorUserId: 'cashier-1' });

    expect(result.status).toBe('UNPAID');
    expect(result.paidAmount).toBe(0);
    expect(invoiceRepository.invoices.get(invoice.id)!.status).toBe('UNPAID');
  });

  it('partially refunds a payment, moving the Invoice to PARTIALLY_PAID', async () => {
    const { invoiceRepository, paymentRepository, useCase } = buildSut();
    const { payment } = await seedPaidInvoice(invoiceRepository, paymentRepository, 400000);

    const result = await useCase.execute({ paymentId: payment.id, amount: 100000, reason: 'x', actorUserId: 'cashier-1' });

    expect(result.status).toBe('PARTIALLY_PAID');
    expect(result.paidAmount).toBe(300000);
  });

  it('rejects refunding more than the remaining refundable balance', async () => {
    const { invoiceRepository, paymentRepository, useCase } = buildSut();
    const { payment } = await seedPaidInvoice(invoiceRepository, paymentRepository, 400000);
    await useCase.execute({ paymentId: payment.id, amount: 300000, reason: 'x', actorUserId: 'cashier-1' });

    await expect(
      useCase.execute({ paymentId: payment.id, amount: 200000, reason: 'x', actorUserId: 'cashier-1' }),
    ).rejects.toBeInstanceOf(RefundExceedsPaymentException);
  });

  it('rejects once the Invoice is CLOSED', async () => {
    const { invoiceRepository, paymentRepository, useCase } = buildSut();
    const { invoice, payment } = await seedPaidInvoice(invoiceRepository, paymentRepository, 400000);
    invoiceRepository.invoices.get(invoice.id)!.status = 'CLOSED' as never;

    await expect(
      useCase.execute({ paymentId: payment.id, amount: 100000, reason: 'x', actorUserId: 'cashier-1' }),
    ).rejects.toBeInstanceOf(InvoiceAlreadyClosedException);
  });

  it('publishes PaymentRefunded', async () => {
    const { invoiceRepository, paymentRepository, eventBus, useCase } = buildSut();
    const { payment } = await seedPaidInvoice(invoiceRepository, paymentRepository, 400000);

    await useCase.execute({ paymentId: payment.id, amount: 100000, reason: 'x', actorUserId: 'cashier-1' });

    const published = eventBus.published.find((p) => p.eventName === PAYMENT_REFUNDED_EVENT);
    expect(published).toBeDefined();
    expect(published?.payload).toMatchObject({ paymentId: payment.id, refundAmount: 100000 });
  });
});
