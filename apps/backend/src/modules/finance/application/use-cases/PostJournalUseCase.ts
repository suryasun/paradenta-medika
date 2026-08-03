import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  FinancialPeriodClosedException,
  JournalDuplicatePostingException,
  JournalNotFoundException,
  JournalNotInStatusException,
  JournalSegregationOfDutiesException,
} from '../../domain/exceptions/FinanceExceptions';
import { IFinancialPeriodRepository } from '../../domain/repositories/IFinancialPeriodRepository';
import { IJournalRepository } from '../../domain/repositories/IJournalRepository';
import { JournalNumberGenerator } from '../services/JournalNumberGenerator';
import { JournalResponseDto } from '../dtos/JournalResponseDto';
import { toJournalResponseDto } from '../mappers/JournalMapper';

export interface PostJournalInput {
  journalId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export interface JournalPostedEventPayload {
  journalId: string;
  journalNo: string;
  branchId: string;
  postedBy: string;
  postedAt: string;
}

/**
 * docs/06-tasks/task-150.md; docs/03-sad/17-module-finance.md UC-FIN-002.
 * The transaction boundary: rejects self-posting
 * (`FIN_SEGREGATION_OF_DUTIES`), rejects a journalDate outside any OPEN
 * financial period (`FIN_PERIOD_CLOSED` -- also thrown when no period
 * record covers the date at all, since there is then no open period to
 * post into either), rejects a duplicate automatic-posting reference
 * (`FIN_DUPLICATE_POSTING`, only meaningful when referenceType/
 * referenceId/postingType are set), and assigns the immutable
 * `journalNo` only now (task-146 AC).
 */
export class PostJournalUseCase {
  constructor(
    private readonly journalRepository: IJournalRepository,
    private readonly financialPeriodRepository: IFinancialPeriodRepository,
    private readonly numberGenerator: JournalNumberGenerator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: PostJournalInput): Promise<JournalResponseDto> {
    const existing = await this.journalRepository.findById(input.journalId);
    if (!existing) {
      throw new JournalNotFoundException();
    }
    if (existing.status !== 'DRAFT') {
      throw new JournalNotInStatusException('DRAFT');
    }
    if (existing.createdBy && existing.createdBy === input.actorUserId) {
      throw new JournalSegregationOfDutiesException();
    }

    const openPeriod = await this.financialPeriodRepository.findOpenPeriodForDate(existing.branchId, existing.journalDate);
    if (!openPeriod) {
      throw new FinancialPeriodClosedException();
    }

    if (existing.referenceType && existing.referenceId && existing.postingType) {
      const alreadyPosted = await this.journalRepository.findByReference(existing.referenceType, existing.referenceId, existing.postingType);
      if (alreadyPosted && alreadyPosted.status === 'POSTED') {
        throw new JournalDuplicatePostingException();
      }
    }

    const now = new Date();
    const journalNo = await this.numberGenerator.generate(now);
    const posted = await this.journalRepository.markPosted(input.journalId, journalNo, input.actorUserId, now);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Journal',
      input.journalId,
      'UPDATE',
      { status: 'DRAFT' },
      { status: 'POSTED', journalNo },
      auditContext,
    );

    const eventPayload: JournalPostedEventPayload = {
      journalId: posted.id,
      journalNo,
      branchId: posted.branchId,
      postedBy: input.actorUserId,
      postedAt: now.toISOString(),
    };
    await this.eventBus.publish('finance.journal.posted.v1', eventPayload);

    return toJournalResponseDto(posted);
  }
}
