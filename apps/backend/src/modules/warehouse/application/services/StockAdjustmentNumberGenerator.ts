import { IStockAdjustmentRepository } from '../../domain/repositories/IStockAdjustmentRepository';

const MAX_ATTEMPTS = 5;

export class StockAdjustmentNumberGenerator {
  constructor(private readonly stockAdjustmentRepository: IStockAdjustmentRepository) {}

  async generate(date: Date): Promise<string> {
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const baseCount = await this.stockAdjustmentRepository.count();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `ADJ-${datePart}-${String(baseCount + 1 + attempt).padStart(4, '0')}`;
      const existing = await this.stockAdjustmentRepository.findByNumber(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Stock Adjustment Number');
  }
}
