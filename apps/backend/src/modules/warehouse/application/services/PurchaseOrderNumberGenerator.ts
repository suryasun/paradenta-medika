import { IPurchaseOrderRepository } from '../../domain/repositories/IPurchaseOrderRepository';

const MAX_ATTEMPTS = 5;

/** No literal PO number format is specified in the SAD; mirrors ReservationNumberGenerator's established date-prefixed sequential-counter convention. */
export class PurchaseOrderNumberGenerator {
  constructor(private readonly purchaseOrderRepository: IPurchaseOrderRepository) {}

  async generate(date: Date): Promise<string> {
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const baseCount = await this.purchaseOrderRepository.count();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `PO-${datePart}-${String(baseCount + 1 + attempt).padStart(4, '0')}`;
      const existing = await this.purchaseOrderRepository.findByNumber(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Purchase Order Number');
  }
}
