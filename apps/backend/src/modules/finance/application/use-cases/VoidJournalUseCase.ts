import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { JournalNotFoundException, JournalNotInStatusException } from '../../domain/exceptions/FinanceExceptions';
import { IJournalRepository } from '../../domain/repositories/IJournalRepository';
import { JournalResponseDto } from '../dtos/JournalResponseDto';
import { toJournalResponseDto } from '../mappers/JournalMapper';

export interface VoidJournalInput {
  journalId: string;
  reason?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-152.md AC: "Void rejected on an already-posted journal (must use Reverse instead)" -- draft-only. */
export class VoidJournalUseCase {
  constructor(
    private readonly journalRepository: IJournalRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: VoidJournalInput): Promise<JournalResponseDto> {
    const existing = await this.journalRepository.findById(input.journalId);
    if (!existing) {
      throw new JournalNotFoundException();
    }
    if (existing.status !== 'DRAFT') {
      throw new JournalNotInStatusException('DRAFT');
    }

    const now = new Date();
    const voided = await this.journalRepository.markVoided(input.journalId, input.actorUserId, now, input.reason);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Journal',
      input.journalId,
      'UPDATE',
      { status: 'DRAFT' },
      { status: 'VOIDED', reason: input.reason },
      auditContext,
    );

    return toJournalResponseDto(voided);
  }
}
