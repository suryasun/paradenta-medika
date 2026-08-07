import { SyncTreatmentUpdateToInvoiceUseCase } from './SyncTreatmentUpdateToInvoiceUseCase';
import { FakeInvoiceRepository, FakeInvoiceItemRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';

function buildSut() {
  const invoiceRepository = new FakeInvoiceRepository();
  const invoiceItemRepository = new FakeInvoiceItemRepository();
  const auditService = new FakeAuditService();
  const useCase = new SyncTreatmentUpdateToInvoiceUseCase(invoiceRepository, invoiceItemRepository, auditService);
  return { invoiceRepository, invoiceItemRepository, auditService, useCase };
}

// docs/06-tasks/task-321.md
describe('SyncTreatmentUpdateToInvoiceUseCase', () => {
  it('no-ops when no Invoice exists yet for the visit', async () => {
    const { useCase } = buildSut();
    await expect(
      useCase.execute({ visitId: 'v1', visitTreatmentId: 'vt1', treatmentName: 'Scaling', quantity: 2, unitPrice: 100000, subtotal: 200000 }),
    ).resolves.toBeUndefined();
  });

  it('no-ops when the Invoice is already PAID', async () => {
    const { invoiceRepository, invoiceItemRepository, useCase } = buildSut();
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV1', visitId: 'v1', patientId: 'p1', branchId: 'b1', subtotal: 100000, discount: 0, tax: 0, grandTotal: 100000, createdBy: 'admin',
    });
    invoiceRepository.invoices.get(invoice.id)!.status = 'PAID';
    await invoiceItemRepository.createMany([
      { invoiceId: invoice.id, referenceType: 'Treatment', referenceId: 't1', visitTreatmentId: 'vt1', itemName: 'Scaling', quantity: 1, unitPrice: 100000, discount: 0, tax: 0, total: 100000 },
    ]);

    await useCase.execute({ visitId: 'v1', visitTreatmentId: 'vt1', treatmentName: 'Scaling', quantity: 3, unitPrice: 100000, subtotal: 300000 });

    const items = await invoiceItemRepository.findByInvoiceId(invoice.id);
    expect(Number(items[0].total)).toBe(100000);
  });

  it('no-ops when no matching InvoiceItem is found (pre-existing invoice without visitTreatmentId)', async () => {
    const { invoiceRepository, invoiceItemRepository, useCase } = buildSut();
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV2', visitId: 'v1', patientId: 'p1', branchId: 'b1', subtotal: 100000, discount: 0, tax: 0, grandTotal: 100000, createdBy: 'admin',
    });

    await useCase.execute({ visitId: 'v1', visitTreatmentId: 'does-not-exist', treatmentName: 'Scaling', quantity: 2, unitPrice: 100000, subtotal: 200000 });

    expect(Number(invoiceRepository.invoices.get(invoice.id)!.grandTotal)).toBe(100000);
  });

  it('updates the matching InvoiceItem and recalculates totals when the Invoice is UNPAID', async () => {
    const { invoiceRepository, invoiceItemRepository, useCase } = buildSut();
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV3', visitId: 'v1', patientId: 'p1', branchId: 'b1', subtotal: 300000, discount: 0, tax: 0, grandTotal: 300000, createdBy: 'admin',
    });
    await invoiceItemRepository.createMany([
      { invoiceId: invoice.id, referenceType: 'Treatment', referenceId: 't1', visitTreatmentId: 'vt1', itemName: 'Scaling', quantity: 1, unitPrice: 100000, discount: 0, tax: 0, total: 100000 },
      { invoiceId: invoice.id, referenceType: 'Treatment', referenceId: 't2', visitTreatmentId: 'vt2', itemName: 'Filling', quantity: 1, unitPrice: 200000, discount: 0, tax: 0, total: 200000 },
    ]);

    await useCase.execute({ visitId: 'v1', visitTreatmentId: 'vt1', treatmentName: 'Scaling (Deep)', quantity: 2, unitPrice: 150000, subtotal: 300000 });

    const items = await invoiceItemRepository.findByInvoiceId(invoice.id);
    const updated = items.find((i) => i.visitTreatmentId === 'vt1')!;
    expect(updated.itemName).toBe('Scaling (Deep)');
    expect(Number(updated.total)).toBe(300000);

    const updatedInvoice = invoiceRepository.invoices.get(invoice.id)!;
    // 300000 (original) - 100000 (old item) + 300000 (new item) = 500000
    expect(Number(updatedInvoice.grandTotal)).toBe(500000);
  });
});
