import { IGoodsReceiptRepository } from '../../domain/repositories/IGoodsReceiptRepository';

const MAX_ATTEMPTS = 5;

export class GoodsReceiptNumberGenerator {
  constructor(private readonly goodsReceiptRepository: IGoodsReceiptRepository) {}

  async generate(date: Date): Promise<string> {
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const baseCount = await this.goodsReceiptRepository.count();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `GR-${datePart}-${String(baseCount + 1 + attempt).padStart(4, '0')}`;
      const existing = await this.goodsReceiptRepository.findByNumber(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Goods Receipt Number');
  }
}
