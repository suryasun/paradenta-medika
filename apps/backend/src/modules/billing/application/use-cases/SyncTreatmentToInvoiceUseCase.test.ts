import { SyncTreatmentToInvoiceUseCase } from './SyncTreatmentToInvoiceUseCase';
import { FakeInvoiceRepository, FakeInvoiceItemRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';

function buildSut() {
  const invoiceRepository = new FakeInvoiceRepository();
  const invoiceItemRepository = new FakeInvoiceItemRepository();
  const auditService = new FakeAuditService();
  const useCase = new SyncTreatmentToInvoiceUseCase(invoiceRepository, invoiceItemRepository, auditService);
  return { invoiceRepository, invoiceItemRepository, auditService, useCase };
}

const baseInput = {
  visitId: 'visit-1',
  visitTreatmentId: 'vt-1',
  treatmentId: 'treatment-1',
  treatmentName: 'Scaling',
  quantity: 1,
  unitPrice: 100000,
  subtotal: 100000,
};

// docs/06-tasks/task-320.md
describe('SyncTreatmentToInvoiceUseCase', () => {
  it('no-ops when no Invoice exists yet for the visit', async () => {
    const { invoiceItemRepository, useCase } = buildSut();

    await useCase.execute(baseInput);

    expect(await invoiceItemRepository.findByInvoiceId('anything')).toEqual([]);
  });

  it('no-ops when the Invoice is already PAID', async () => {
    const { invoiceRepository, invoiceItemRepository, useCase } = buildSut();
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV1', visitId: 'visit-1', patientId: 'p1', branchId: 'b1',
      subtotal: 200000, discount: 0, tax: 0, grandTotal: 200000, createdBy: 'admin',
    });
    invoiceRepository.invoices.get(invoice.id)!.status = 'PAID';

    await useCase.execute(baseInput);

    expect(await invoiceItemRepository.findByInvoiceId(invoice.id)).toEqual([]);
    expect(Number(invoiceRepository.invoices.get(invoice.id)!.grandTotal)).toBe(200000);
  });

  it('no-ops when the Invoice is already CLOSED', async () => {
    const { invoiceRepository, invoiceItemRepository, useCase } = buildSut();
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV2', visitId: 'visit-1', patientId: 'p1', branchId: 'b1',
      subtotal: 200000, discount: 0, tax: 0, grandTotal: 200000, createdBy: 'admin',
    });
    invoiceRepository.invoices.get(invoice.id)!.status = 'CLOSED';

    await useCase.execute(baseInput);

    expect(await invoiceItemRepository.findByInvoiceId(invoice.id)).toEqual([]);
  });

  it('appends a new InvoiceItem and recalculates totals when the Invoice is UNPAID', async () => {
    const { invoiceRepository, invoiceItemRepository, useCase } = buildSut();
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV3', visitId: 'visit-1', patientId: 'p1', branchId: 'b1',
      subtotal: 200000, discount: 0, tax: 0, grandTotal: 200000, createdBy: 'admin',
    });

    await useCase.execute(baseInput);

    const items = await invoiceItemRepository.findByInvoiceId(invoice.id);
    expect(items).toHaveLength(1);
    expect(items[0].itemName).toBe('Scaling');
    expect(Number(items[0].total)).toBe(100000);

    const updated = invoiceRepository.invoices.get(invoice.id)!;
    expect(Number(updated.subtotal)).toBe(300000);
    expect(Number(updated.grandTotal)).toBe(300000);
  });

  it('appends a new InvoiceItem and recalculates totals when the Invoice is PARTIALLY_PAID', async () => {
    const { invoiceRepository, invoiceItemRepository, useCase } = buildSut();
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV4', visitId: 'visit-1', patientId: 'p1', branchId: 'b1',
      subtotal: 200000, discount: 0, tax: 0, grandTotal: 200000, createdBy: 'admin',
    });
    invoiceRepository.invoices.get(invoice.id)!.status = 'PARTIALLY_PAID';
    invoiceRepository.invoices.get(invoice.id)!.paidAmount = 50000 as never;

    await useCase.execute(baseInput);

    const updated = invoiceRepository.invoices.get(invoice.id)!;
    expect(Number(updated.grandTotal)).toBe(300000);
    expect(Number(updated.paidAmount)).toBe(50000);
  });
});
