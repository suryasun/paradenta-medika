import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { AccountNotPostableException } from '../../domain/exceptions/FinanceExceptions';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { IJournalRepository } from '../../domain/repositories/IJournalRepository';
import { validateBalancedLines } from '../services/JournalLineValidator';
import { JournalLineEntryDto } from '../dtos/JournalRequestDto';
import { JournalResponseDto } from '../dtos/JournalResponseDto';
import { toJournalResponseDto } from '../mappers/JournalMapper';

export interface CreateManualJournalInput {
  branchId: string;
  journalDate: string;
  description: string;
  lines: JournalLineEntryDto[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-146.md/task-147.md; docs/03-sad/17-module-finance.md
 * UC-FIN-002 step 1. Creates a draft journal (stock/ledger unaffected
 * until Post). Validates the balance invariant and that every targeted
 * account is active and postable (`FIN_ACCOUNT_NOT_POSTABLE`) before
 * persistence -- both task-147 ACs.
 */
export class CreateManualJournalUseCase {
  constructor(
    private readonly journalRepository: IJournalRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateManualJournalInput): Promise<JournalResponseDto> {
    validateBalancedLines(input.lines);

    for (const line of input.lines) {
      const account = await this.accountRepository.findById(line.accountId);
      if (!account || !account.isPostable || !account.isActive) {
        throw new AccountNotPostableException();
      }
    }

    const journal = await this.journalRepository.create({
      branchId: input.branchId,
      journalDate: new Date(input.journalDate),
      description: input.description,
      lines: input.lines.map((line) => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description,
        costCenterId: line.costCenterId,
      })),
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Journal',
      journal.id,
      'CREATE',
      null,
      { branchId: input.branchId, journalDate: input.journalDate, lineCount: input.lines.length },
      auditContext,
    );

    return toJournalResponseDto(journal);
  }
}
