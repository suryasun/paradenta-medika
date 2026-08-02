import { IStockTransferRepository } from '../../domain/repositories/IStockTransferRepository';

const MAX_ATTEMPTS = 5;

export class StockTransferNumberGenerator {
  constructor(private readonly stockTransferRepository: IStockTransferRepository) {}

  async generate(date: Date): Promise<string> {
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const baseCount = await this.stockTransferRepository.count();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `TRF-${datePart}-${String(baseCount + 1 + attempt).padStart(4, '0')}`;
      const existing = await this.stockTransferRepository.findByNumber(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Stock Transfer Number');
  }
}
