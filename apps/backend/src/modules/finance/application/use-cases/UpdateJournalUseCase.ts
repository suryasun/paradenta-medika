import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { AccountNotPostableException, JournalNotFoundException, JournalNotInStatusException } from '../../domain/exceptions/FinanceExceptions';
import { IAccountRepository } from '../../domain/repositories/IAccountRepository';
import { IJournalRepository } from '../../domain/repositories/IJournalRepository';
import { validateBalancedLines } from '../services/JournalLineValidator';
import { JournalLineEntryDto } from '../dtos/JournalRequestDto';
import { JournalResponseDto } from '../dtos/JournalResponseDto';
import { toJournalResponseDto } from '../mappers/JournalMapper';

export interface UpdateJournalInput {
  journalId: string;
  journalDate?: string;
  description?: string;
  lines?: JournalLineEntryDto[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-149.md AC: "Update rejected once journal is posted/reversed/voided (must be draft)." */
export class UpdateJournalUseCase {
  constructor(
    private readonly journalRepository: IJournalRepository,
    private readonly accountRepository: IAccountRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: UpdateJournalInput): Promise<JournalResponseDto> {
    const existing = await this.journalRepository.findById(input.journalId);
    if (!existing) {
      throw new JournalNotFoundException();
    }
    if (existing.status !== 'DRAFT') {
      throw new JournalNotInStatusException('DRAFT');
    }

    if (input.lines) {
      validateBalancedLines(input.lines);
      for (const line of input.lines) {
        const account = await this.accountRepository.findById(line.accountId);
        if (!account || !account.isPostable || !account.isActive) {
          throw new AccountNotPostableException();
        }
      }
    }

    const updated = await this.journalRepository.replaceLines(input.journalId, {
      journalDate: input.journalDate ? new Date(input.journalDate) : undefined,
      description: input.description,
      lines: input.lines?.map((line) => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description,
        costCenterId: line.costCenterId,
      })),
      updatedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Journal', input.journalId, 'UPDATE', existing, updated, auditContext);

    return toJournalResponseDto(updated);
  }
}
