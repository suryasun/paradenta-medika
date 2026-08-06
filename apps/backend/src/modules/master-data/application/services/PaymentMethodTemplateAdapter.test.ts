import { PaymentMethodTemplateAdapter } from './PaymentMethodTemplateAdapter';
import { FakePaymentMethodRepository } from '../../../../../tests/fakes/billingFakes';

describe('PaymentMethodTemplateAdapter (Phase 4 hardening)', () => {
  it('creates a branch-specific override without touching the global row', async () => {
    const paymentMethodRepository = new FakePaymentMethodRepository();
    const global = await paymentMethodRepository.create({ methodCode: 'QRIS', methodName: 'QRIS', isCash: false });
    const adapter = new PaymentMethodTemplateAdapter(paymentMethodRepository);

    const result = await adapter.applyToEntity('branch-a', { methodCode: 'QRIS', methodName: 'QRIS (Branch A promo)', isCash: false });

    expect(result.created).toBe(true);
    const globalStillIntact = await paymentMethodRepository.findById(global.id);
    expect(globalStillIntact?.methodName).toBe('QRIS');
    const override = await paymentMethodRepository.findById(result.entityId);
    expect(override?.branchId).toBe('branch-a');
    expect(override?.methodName).toBe('QRIS (Branch A promo)');
  });

  it('applying again updates the same branch-specific row', async () => {
    const paymentMethodRepository = new FakePaymentMethodRepository();
    const adapter = new PaymentMethodTemplateAdapter(paymentMethodRepository);
    const first = await adapter.applyToEntity('branch-a', { methodCode: 'QRIS', methodName: 'V1' });

    const second = await adapter.applyToEntity('branch-a', { methodCode: 'QRIS', methodName: 'V2' });

    expect(second.entityId).toBe(first.entityId);
    expect((await paymentMethodRepository.findById(second.entityId))?.methodName).toBe('V2');
  });
});
