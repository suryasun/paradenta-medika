import { CancelInvoiceUseCase } from './CancelInvoiceUseCase';
import { FakeInvoiceRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { InvoiceAlreadyClosedException, InvoiceHasPaymentException } from '../../domain/exceptions/BillingExceptions';

function buildSut() {
  const invoiceRepository = new FakeInvoiceRepository();
  const auditService = new FakeAuditService();
  const useCase = new CancelInvoiceUseCase(invoiceRepository, auditService);
  return { invoiceRepository, useCase };
}

async function seedInvoice(repo: FakeInvoiceRepository) {
  return repo.create({ invoiceNo: 'INV1', visitId: 'v1', patientId: 'p1', branchId: 'b1', subtotal: 400000, discount: 0, tax: 0, grandTotal: 400000, createdBy: 'admin' });
}

// docs/06-tasks/task-324.md
describe('CancelInvoiceUseCase', () => {
  it('cancels a zero-payment UNPAID Invoice with a mandatory reason', async () => {
    const { invoiceRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository);

    const result = await useCase.execute({ invoiceId: invoice.id, reason: 'Duplicate', actorUserId: 'cashier-1' });

    expect(result.status).toBe('CANCELLED');
    expect(result.cancelReason).toBe('Duplicate');
    expect(result.cancelledBy).toBe('cashier-1');
  });

  it('rejects once any payment has been recorded', async () => {
    const { invoiceRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository);
    invoiceRepository.invoices.get(invoice.id)!.paidAmount = 100000 as never;
    invoiceRepository.invoices.get(invoice.id)!.status = 'PARTIALLY_PAID' as never;

    await expect(useCase.execute({ invoiceId: invoice.id, reason: 'x', actorUserId: 'cashier-1' })).rejects.toBeInstanceOf(InvoiceHasPaymentException);
  });

  it('rejects once CLOSED', async () => {
    const { invoiceRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository);
    invoiceRepository.invoices.get(invoice.id)!.status = 'CLOSED' as never;

    await expect(useCase.execute({ invoiceId: invoice.id, reason: 'x', actorUserId: 'cashier-1' })).rejects.toBeInstanceOf(InvoiceAlreadyClosedException);
  });
});
