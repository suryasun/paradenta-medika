import { ApplyDiscountUseCase } from './ApplyDiscountUseCase';
import { RemoveDiscountUseCase } from './RemoveDiscountUseCase';
import { FakeInvoiceRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { DiscountExceedsSubtotalException, InvoiceNotEditableException } from '../../domain/exceptions/BillingExceptions';

function buildSut() {
  const invoiceRepository = new FakeInvoiceRepository();
  const auditService = new FakeAuditService();
  const applyDiscount = new ApplyDiscountUseCase(invoiceRepository, auditService);
  const removeDiscount = new RemoveDiscountUseCase(invoiceRepository, auditService);
  return { invoiceRepository, applyDiscount, removeDiscount };
}

async function seedInvoice(repo: FakeInvoiceRepository, subtotal = 500000, tax = 0) {
  return repo.create({ invoiceNo: 'INV1', visitId: 'v1', patientId: 'p1', branchId: 'b1', subtotal, discount: 0, tax, grandTotal: subtotal + tax, createdBy: 'admin' });
}

// docs/06-tasks/task-322.md
describe('ApplyDiscountUseCase', () => {
  it('applies a discount and recomputes grandTotal', async () => {
    const { invoiceRepository, applyDiscount } = buildSut();
    const invoice = await seedInvoice(invoiceRepository, 500000);

    const result = await applyDiscount.execute({ invoiceId: invoice.id, amount: 50000, source: 'MANUAL', reason: 'Loyal patient', actorUserId: 'cashier-1' });

    expect(result.discount).toBe(50000);
    expect(result.grandTotal).toBe(450000);
    expect(result.discountReason).toBe('Loyal patient');
    expect(result.discountSource).toBe('MANUAL');
    expect(result.discountApprovedBy).toBe('cashier-1');
  });

  it('rejects a discount exceeding the subtotal', async () => {
    const { invoiceRepository, applyDiscount } = buildSut();
    const invoice = await seedInvoice(invoiceRepository, 500000);

    await expect(
      applyDiscount.execute({ invoiceId: invoice.id, amount: 600000, source: 'MANUAL', reason: 'x', actorUserId: 'cashier-1' }),
    ).rejects.toBeInstanceOf(DiscountExceedsSubtotalException);
  });

  it('rejects once the Invoice is PAID', async () => {
    const { invoiceRepository, applyDiscount } = buildSut();
    const invoice = await seedInvoice(invoiceRepository, 500000);
    invoiceRepository.invoices.get(invoice.id)!.status = 'PAID';

    await expect(
      applyDiscount.execute({ invoiceId: invoice.id, amount: 10000, source: 'MANUAL', reason: 'x', actorUserId: 'cashier-1' }),
    ).rejects.toBeInstanceOf(InvoiceNotEditableException);
  });
});

describe('RemoveDiscountUseCase', () => {
  it('clears the discount and restores grandTotal to subtotal + tax', async () => {
    const { invoiceRepository, applyDiscount, removeDiscount } = buildSut();
    const invoice = await seedInvoice(invoiceRepository, 500000, 10000);
    await applyDiscount.execute({ invoiceId: invoice.id, amount: 50000, source: 'MANUAL', reason: 'x', actorUserId: 'cashier-1' });

    const result = await removeDiscount.execute({ invoiceId: invoice.id, actorUserId: 'cashier-1' });

    expect(result.discount).toBe(0);
    expect(result.grandTotal).toBe(510000);
    expect(result.discountReason).toBeNull();
  });
});
