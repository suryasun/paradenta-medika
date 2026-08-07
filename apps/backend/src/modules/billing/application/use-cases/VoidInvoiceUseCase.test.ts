import { VoidInvoiceUseCase } from './VoidInvoiceUseCase';
import { FakeInvoiceRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { InvoiceAlreadyClosedException, InvoiceAlreadyVoidException } from '../../domain/exceptions/BillingExceptions';

function buildSut() {
  const invoiceRepository = new FakeInvoiceRepository();
  const auditService = new FakeAuditService();
  const useCase = new VoidInvoiceUseCase(invoiceRepository, auditService);
  return { invoiceRepository, useCase };
}

async function seedInvoice(repo: FakeInvoiceRepository) {
  return repo.create({ invoiceNo: 'INV1', visitId: 'v1', patientId: 'p1', branchId: 'b1', subtotal: 400000, discount: 0, tax: 0, grandTotal: 400000, createdBy: 'admin' });
}

// docs/06-tasks/task-325.md
describe('VoidInvoiceUseCase', () => {
  it.each(['UNPAID', 'PARTIALLY_PAID', 'PAID'] as const)('voids an Invoice from %s with a mandatory reason', async (status) => {
    const { invoiceRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository);
    invoiceRepository.invoices.get(invoice.id)!.status = status as never;

    const result = await useCase.execute({ invoiceId: invoice.id, reason: 'Wrong patient', actorUserId: 'cashier-1' });

    expect(result.status).toBe('VOID');
    expect(result.voidReason).toBe('Wrong patient');
    expect(result.voidedBy).toBe('cashier-1');
  });

  it('does not require Payments to be refunded first (voids a PAID invoice directly)', async () => {
    const { invoiceRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository);
    invoiceRepository.invoices.get(invoice.id)!.status = 'PAID' as never;
    invoiceRepository.invoices.get(invoice.id)!.paidAmount = 400000 as never;

    const result = await useCase.execute({ invoiceId: invoice.id, reason: 'x', actorUserId: 'cashier-1' });
    expect(result.status).toBe('VOID');
  });

  it('rejects once CLOSED', async () => {
    const { invoiceRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository);
    invoiceRepository.invoices.get(invoice.id)!.status = 'CLOSED' as never;

    await expect(useCase.execute({ invoiceId: invoice.id, reason: 'x', actorUserId: 'cashier-1' })).rejects.toBeInstanceOf(InvoiceAlreadyClosedException);
  });

  it('rejects if already VOID', async () => {
    const { invoiceRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository);
    invoiceRepository.invoices.get(invoice.id)!.status = 'VOID' as never;

    await expect(useCase.execute({ invoiceId: invoice.id, reason: 'x', actorUserId: 'cashier-1' })).rejects.toBeInstanceOf(InvoiceAlreadyVoidException);
  });
});
