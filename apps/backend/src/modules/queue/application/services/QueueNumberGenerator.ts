import { IQueueRepository } from '../../domain/repositories/IQueueRepository';

/**
 * docs/03-sad/14-module-queue.md Section 17: unique, sequential, reset
 * daily, independent per Branch. Section 17.2's format is
 * `PREFIX + Running Number`, configurable via System Parameter -- no
 * System Parameter table exists in the Phase 1 schema (not part of any
 * Epic C task), so a single fixed prefix ("A") is used, per Section 17.2's
 * own documented example, rather than inventing a configuration mechanism.
 */
const DEFAULT_QUEUE_PREFIX = 'A';

export class QueueNumberGenerator {
  constructor(private readonly queueRepository: IQueueRepository) {}

  async generate(branchId: string, date: Date): Promise<{ queueNumber: string; queuePrefix: string }> {
    const lastNumber = await this.queueRepository.countLastQueueNumber(branchId, date);
    const nextNumber = lastNumber + 1;
    return {
      queueNumber: `${DEFAULT_QUEUE_PREFIX}${String(nextNumber).padStart(3, '0')}`,
      queuePrefix: DEFAULT_QUEUE_PREFIX,
    };
  }
}
