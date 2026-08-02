import { IStockOpnameRepository } from '../../domain/repositories/IStockOpnameRepository';

const MAX_ATTEMPTS = 5;

export class StockOpnameNumberGenerator {
  constructor(private readonly stockOpnameRepository: IStockOpnameRepository) {}

  async generate(date: Date): Promise<string> {
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const baseCount = await this.stockOpnameRepository.count();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `OPN-${datePart}-${String(baseCount + 1 + attempt).padStart(4, '0')}`;
      const existing = await this.stockOpnameRepository.findByNumber(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Stock Opname Number');
  }
}
