import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { FinancialPeriodClosedException, JournalNotFoundException, JournalNotInStatusException } from '../../domain/exceptions/FinanceExceptions';
import { IFinancialPeriodRepository } from '../../domain/repositories/IFinancialPeriodRepository';
import { IJournalRepository } from '../../domain/repositories/IJournalRepository';
import { JournalNumberGenerator } from '../services/JournalNumberGenerator';
import { JournalResponseDto } from '../dtos/JournalResponseDto';
import { toJournalResponseDto } from '../mappers/JournalMapper';

export interface ReverseJournalInput {
  journalId: string;
  journalDate: string;
  reason: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-151.md; docs/03-sad/17-module-finance.md Section
 * 3.7 state machine (Posted -> Reversed) and Section 6.2 ("Reversal
 * request must contain journalDate and reason"). Creates a new, already-
 * posted journal with every line's debit/credit swapped (netting the
 * original to zero), links it via `reversalOfId`, and marks the original
 * `REVERSED` -- both writes happen atomically in the repository. A
 * journal that has already been reversed is naturally rejected by the
 * `status !== 'POSTED'` guard below (it's now `REVERSED`), so reversing
 * it twice is covered without a separate check (Section 5.2's
 * `reversal_of_id` unique constraint is the DB-level backstop for the
 * same invariant). Also rejects a reversal date outside any open
 * period, the same `FIN_PERIOD_CLOSED` gate as Post.
 */
export class ReverseJournalUseCase {
  constructor(
    private readonly journalRepository: IJournalRepository,
    private readonly financialPeriodRepository: IFinancialPeriodRepository,
    private readonly numberGenerator: JournalNumberGenerator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: ReverseJournalInput): Promise<JournalResponseDto> {
    const existing = await this.journalRepository.findById(input.journalId);
    if (!existing) {
      throw new JournalNotFoundException();
    }
    if (existing.status !== 'POSTED') {
      throw new JournalNotInStatusException('POSTED');
    }

    const journalDate = new Date(input.journalDate);
    const openPeriod = await this.financialPeriodRepository.findOpenPeriodForDate(existing.branchId, journalDate);
    if (!openPeriod) {
      throw new FinancialPeriodClosedException();
    }

    const journalNo = await this.numberGenerator.generate(journalDate);
    const reversal = await this.journalRepository.createReversal(existing, {
      journalNo,
      journalDate,
      reason: input.reason,
      actorUserId: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Journal',
      input.journalId,
      'UPDATE',
      { status: 'POSTED' },
      { status: 'REVERSED', reversalJournalId: reversal.id, reason: input.reason },
      auditContext,
    );

    await this.eventBus.publish('finance.journal.reversed.v1', {
      journalId: existing.id,
      reversalJournalId: reversal.id,
      reversalJournalNo: journalNo,
      branchId: existing.branchId,
      reversedBy: input.actorUserId,
      reversedAt: new Date().toISOString(),
    });

    return toJournalResponseDto(reversal);
  }
}
