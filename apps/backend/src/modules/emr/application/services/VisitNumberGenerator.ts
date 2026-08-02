import { IVisitRepository } from '../../domain/repositories/IVisitRepository';

const MAX_ATTEMPTS = 5;

/**
 * Exact visit number format is NOT DEFINED IN SAD; follows the same
 * sequential-counter pattern already used for Patient MRNs and Reservation
 * numbers.
 */
export class VisitNumberGenerator {
  constructor(private readonly visitRepository: IVisitRepository) {}

  async generate(): Promise<string> {
    const baseCount = await this.visitRepository.count();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `VIS${String(baseCount + 1 + attempt).padStart(6, '0')}`;
      const existing = await this.visitRepository.findByVisitNo(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Visit Number');
  }
}
