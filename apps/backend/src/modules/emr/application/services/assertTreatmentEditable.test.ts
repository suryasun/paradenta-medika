import { assertTreatmentEditable } from './assertTreatmentEditable';
import { TreatmentLockedException } from '../../domain/exceptions/EmrExceptions';
import { FakeInvoiceRepository } from '../../../../../tests/fakes/billingFakes';

// docs/06-tasks/task-317.md
describe('assertTreatmentEditable', () => {
  it('does not throw when no invoice exists yet for the visit', async () => {
    const invoiceRepository = new FakeInvoiceRepository();
    await expect(assertTreatmentEditable('visit-1', invoiceRepository)).resolves.toBeUndefined();
  });

  it('does not throw when the invoice is not PAID', async () => {
    const invoiceRepository = new FakeInvoiceRepository();
    await invoiceRepository.create({
      invoiceNo: 'INV1', visitId: 'visit-1', patientId: 'p1', branchId: 'b1',
      subtotal: 100, discount: 0, tax: 0, grandTotal: 100, createdBy: 'admin',
    });
    await expect(assertTreatmentEditable('visit-1', invoiceRepository)).resolves.toBeUndefined();
  });

  it('throws TreatmentLockedException when the invoice is PAID', async () => {
    const invoiceRepository = new FakeInvoiceRepository();
    const invoice = await invoiceRepository.create({
      invoiceNo: 'INV2', visitId: 'visit-1', patientId: 'p1', branchId: 'b1',
      subtotal: 100, discount: 0, tax: 0, grandTotal: 100, createdBy: 'admin',
    });
    invoiceRepository.invoices.get(invoice.id)!.status = 'PAID';

    await expect(assertTreatmentEditable('visit-1', invoiceRepository)).rejects.toBeInstanceOf(TreatmentLockedException);
  });
});
