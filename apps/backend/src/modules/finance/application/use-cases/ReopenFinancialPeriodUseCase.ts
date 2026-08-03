import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { FinancialPeriodNotFoundException, FinancialPeriodNotInStatusException } from '../../domain/exceptions/FinanceExceptions';
import { IFinancialPeriodRepository } from '../../domain/repositories/IFinancialPeriodRepository';
import { FinancialPeriodResponseDto } from '../dtos/FinancialPeriodResponseDto';
import { toFinancialPeriodResponseDto } from '../mappers/FinancialPeriodMapper';

export interface ReopenFinancialPeriodInput {
  periodId: string;
  reason: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-171.md AC: "Reopen requires a mandatory reason and
 * is itself an audited, elevated-permission action distinct from
 * ordinary period-manage permission" -- gated by the literal
 * `finance.period.reopen` Section 8.1 verb (a separate permission from
 * `manage`/`lock`/`close`, not an extrapolation).
 */
export class ReopenFinancialPeriodUseCase {
  constructor(
    private readonly financialPeriodRepository: IFinancialPeriodRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ReopenFinancialPeriodInput): Promise<FinancialPeriodResponseDto> {
    const existing = await this.financialPeriodRepository.findById(input.periodId);
    if (!existing) {
      throw new FinancialPeriodNotFoundException();
    }
    if (existing.status !== 'CLOSED') {
      throw new FinancialPeriodNotInStatusException('CLOSED');
    }

    const now = new Date();
    const reopened = await this.financialPeriodRepository.updateStatus(input.periodId, 'OPEN', {
      reopenedBy: input.actorUserId,
      reopenedAt: now,
      reopenReason: input.reason,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'FinancialPeriod',
      input.periodId,
      'UPDATE',
      { status: 'CLOSED' },
      { status: 'OPEN', reopenedBy: input.actorUserId, reason: input.reason },
      auditContext,
    );

    return toFinancialPeriodResponseDto(reopened);
  }
}
