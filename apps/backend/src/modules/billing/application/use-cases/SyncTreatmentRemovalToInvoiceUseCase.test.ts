import { SyncTreatmentRemovalToInvoiceUseCase } from './SyncTreatmentRemovalToInvoiceUseCase';
import { FakeInvoiceRepository, FakeInvoiceItemRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';

function buildSut() {
  const invoiceRepository = new FakeInvoiceRepository();
  const invoiceItemRepository = new FakeInvoiceItemRepository();
  const auditService = new FakeAuditService();
  const useCase = new SyncTreatmentRemovalToInvoiceUseCase(invoiceRepository, invoiceItemRepository, auditService);
  return { invoiceRepository, invoiceItemRepository, auditService, useCase };
}

// docs/06-tasks/task-321.md
describe('SyncTreatmentRemovalToInvoiceUseCase', () => {
  it('no-ops when no Invoice exists yet for the visit', async () => {
    const { useCase } = buildSut();
    await expect(useCase.execute({ visitId: 'v1', visitTreatmentId: 'vt1' })).resolves.toBeUndefined();
  });

  it('no-ops when the Invoice is already CLOSED', async () => {
    const { invoiceRepository, invoiceItemRepository, useCase } = buildSut();
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV1', visitId: 'v1', patientId: 'p1', branchId: 'b1', subtotal: 100000, discount: 0, tax: 0, grandTotal: 100000, createdBy: 'admin',
    });
    invoiceRepository.invoices.get(invoice.id)!.status = 'CLOSED';
    await invoiceItemRepository.createMany([
      { invoiceId: invoice.id, referenceType: 'Treatment', referenceId: 't1', visitTreatmentId: 'vt1', itemName: 'Scaling', quantity: 1, unitPrice: 100000, discount: 0, tax: 0, total: 100000 },
    ]);

    await useCase.execute({ visitId: 'v1', visitTreatmentId: 'vt1' });

    expect(await invoiceItemRepository.findByInvoiceId(invoice.id)).toHaveLength(1);
  });

  it('deletes the matching InvoiceItem and recalculates totals when the Invoice is UNPAID', async () => {
    const { invoiceRepository, invoiceItemRepository, useCase } = buildSut();
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV2', visitId: 'v1', patientId: 'p1', branchId: 'b1', subtotal: 300000, discount: 0, tax: 0, grandTotal: 300000, createdBy: 'admin',
    });
    await invoiceItemRepository.createMany([
      { invoiceId: invoice.id, referenceType: 'Treatment', referenceId: 't1', visitTreatmentId: 'vt1', itemName: 'Scaling', quantity: 1, unitPrice: 100000, discount: 0, tax: 0, total: 100000 },
      { invoiceId: invoice.id, referenceType: 'Treatment', referenceId: 't2', visitTreatmentId: 'vt2', itemName: 'Filling', quantity: 1, unitPrice: 200000, discount: 0, tax: 0, total: 200000 },
    ]);

    await useCase.execute({ visitId: 'v1', visitTreatmentId: 'vt1' });

    const items = await invoiceItemRepository.findByInvoiceId(invoice.id);
    expect(items).toHaveLength(1);
    expect(items[0].visitTreatmentId).toBe('vt2');

    const updatedInvoice = invoiceRepository.invoices.get(invoice.id)!;
    expect(Number(updatedInvoice.grandTotal)).toBe(200000);
  });
});
