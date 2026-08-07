import { AddManualChargeUseCase } from './AddManualChargeUseCase';
import { FakeInvoiceItemRepository, FakeInvoiceRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { InvoiceNotEditableException } from '../../domain/exceptions/BillingExceptions';

function buildSut() {
  const invoiceRepository = new FakeInvoiceRepository();
  const invoiceItemRepository = new FakeInvoiceItemRepository();
  const auditService = new FakeAuditService();
  const useCase = new AddManualChargeUseCase(invoiceRepository, invoiceItemRepository, auditService);
  return { invoiceRepository, invoiceItemRepository, useCase };
}

async function seedInvoice(repo: FakeInvoiceRepository, subtotal = 400000) {
  return repo.create({ invoiceNo: 'INV1', visitId: 'v1', patientId: 'p1', branchId: 'b1', subtotal, discount: 0, tax: 0, grandTotal: subtotal, createdBy: 'admin' });
}

// docs/06-tasks/task-323.md
describe('AddManualChargeUseCase', () => {
  it('adds a ManualCharge item and recalculates totals', async () => {
    const { invoiceRepository, invoiceItemRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository, 400000);

    const result = await useCase.execute({ invoiceId: invoice.id, itemName: 'Admin Fee', amount: 50000, reason: 'Certificate', actorUserId: 'cashier-1' });

    expect(result.subtotal).toBe(450000);
    expect(result.grandTotal).toBe(450000);

    const items = await invoiceItemRepository.findByInvoiceId(invoice.id);
    expect(items).toHaveLength(1);
    expect(items[0].referenceType).toBe('ManualCharge');
    expect(items[0].reason).toBe('Certificate');
    expect(items[0].referenceId).toBeNull();
  });

  it('coexists with Treatment-sourced items', async () => {
    const { invoiceRepository, invoiceItemRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository, 400000);
    await invoiceItemRepository.createMany([
      { invoiceId: invoice.id, referenceType: 'Treatment', referenceId: 't1', itemName: 'Scaling', quantity: 1, unitPrice: 400000, discount: 0, tax: 0, total: 400000 },
    ]);

    await useCase.execute({ invoiceId: invoice.id, itemName: 'Admin Fee', amount: 50000, reason: 'Certificate', actorUserId: 'cashier-1' });

    const items = await invoiceItemRepository.findByInvoiceId(invoice.id);
    expect(items).toHaveLength(2);
  });

  it('rejects once the Invoice is CLOSED', async () => {
    const { invoiceRepository, useCase } = buildSut();
    const invoice = await seedInvoice(invoiceRepository);
    invoiceRepository.invoices.get(invoice.id)!.status = 'CLOSED';

    await expect(
      useCase.execute({ invoiceId: invoice.id, itemName: 'Admin Fee', amount: 50000, reason: 'x', actorUserId: 'cashier-1' }),
    ).rejects.toBeInstanceOf(InvoiceNotEditableException);
  });
});
