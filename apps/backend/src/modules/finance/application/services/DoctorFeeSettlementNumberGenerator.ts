import { IDoctorFeeSettlementRepository } from '../../domain/repositories/IDoctorFeeSettlementRepository';

const MAX_ATTEMPTS = 5;

export class DoctorFeeSettlementNumberGenerator {
  constructor(private readonly settlementRepository: IDoctorFeeSettlementRepository) {}

  async generate(date: Date): Promise<string> {
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const baseCount = await this.settlementRepository.count();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `DFS-${datePart}-${String(baseCount + 1 + attempt).padStart(4, '0')}`;
      const existing = await this.settlementRepository.findByNumber(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Doctor Fee Settlement Number');
  }
}
