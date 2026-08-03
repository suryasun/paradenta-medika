import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { FinancialPeriodNotFoundException, FinancialPeriodNotInStatusException } from '../../domain/exceptions/FinanceExceptions';
import { IFinancialPeriodRepository } from '../../domain/repositories/IFinancialPeriodRepository';
import { FinancialPeriodResponseDto } from '../dtos/FinancialPeriodResponseDto';
import { toFinancialPeriodResponseDto } from '../mappers/FinancialPeriodMapper';

export interface LockFinancialPeriodInput {
  periodId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-169.md; docs/03-sad/17-module-finance.md Section 3.7 state machine: Open -> Locked. */
export class LockFinancialPeriodUseCase {
  constructor(
    private readonly financialPeriodRepository: IFinancialPeriodRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: LockFinancialPeriodInput): Promise<FinancialPeriodResponseDto> {
    const existing = await this.financialPeriodRepository.findById(input.periodId);
    if (!existing) {
      throw new FinancialPeriodNotFoundException();
    }
    if (existing.status !== 'OPEN') {
      throw new FinancialPeriodNotInStatusException('OPEN');
    }

    const now = new Date();
    const locked = await this.financialPeriodRepository.updateStatus(input.periodId, 'LOCKED', {
      lockedBy: input.actorUserId,
      lockedAt: now,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'FinancialPeriod',
      input.periodId,
      'UPDATE',
      { status: 'OPEN' },
      { status: 'LOCKED', lockedBy: input.actorUserId },
      auditContext,
    );

    return toFinancialPeriodResponseDto(locked);
  }
}
