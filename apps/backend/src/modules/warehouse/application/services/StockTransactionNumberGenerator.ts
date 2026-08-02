import { IStockRepository } from '../../domain/repositories/IStockRepository';

const MAX_ATTEMPTS = 5;

export class StockTransactionNumberGenerator {
  constructor(private readonly stockRepository: IStockRepository) {}

  async generate(date: Date): Promise<string> {
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const baseCount = await this.stockRepository.countTransactions();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `STK-${datePart}-${String(baseCount + 1 + attempt).padStart(4, '0')}`;
      const existing = await this.stockRepository.findByTransactionNumber(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Stock Transaction Number');
  }
}
