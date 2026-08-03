import { IJournalRepository } from '../../domain/repositories/IJournalRepository';

const MAX_ATTEMPTS = 5;

/** docs/03-sad/17-module-finance.md Section 5.2: journal_no "unique, generated, immutable after posting" -- generated at Post time (task-146 AC), not at draft creation. */
export class JournalNumberGenerator {
  constructor(private readonly journalRepository: IJournalRepository) {}

  async generate(date: Date): Promise<string> {
    const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
    const baseCount = await this.journalRepository.count();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      const candidate = `JRN-${datePart}-${String(baseCount + 1 + attempt).padStart(4, '0')}`;
      const existing = await this.journalRepository.findByNumber(candidate);
      if (!existing) {
        return candidate;
      }
    }

    throw new Error('Unable to generate a unique Journal Number');
  }
}
