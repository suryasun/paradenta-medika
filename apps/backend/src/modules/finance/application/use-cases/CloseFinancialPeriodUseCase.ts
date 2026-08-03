import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { FinancialPeriodNotFoundException, FinancialPeriodNotInStatusException } from '../../domain/exceptions/FinanceExceptions';
import { IFinancialPeriodRepository } from '../../domain/repositories/IFinancialPeriodRepository';
import { FinancialPeriodResponseDto } from '../dtos/FinancialPeriodResponseDto';
import { toFinancialPeriodResponseDto } from '../mappers/FinancialPeriodMapper';

export interface CloseFinancialPeriodInput {
  periodId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-170.md AC: "Close only allowed from locked status"
 * and "Publishes FinancialPeriodClosed event exactly once." The full
 * UC-FIN-007 preconditions checklist (pending journals/closings/trial
 * balance validation) is out of this task's literal Backend Scope
 * ("route, controller for POST .../close" + `CloseFinancialPeriodUseCase`
 * only) -- not built here to avoid inventing an unspecified validation
 * checklist; the status guard is the concrete, literal AC.
 */
export class CloseFinancialPeriodUseCase {
  constructor(
    private readonly financialPeriodRepository: IFinancialPeriodRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CloseFinancialPeriodInput): Promise<FinancialPeriodResponseDto> {
    const existing = await this.financialPeriodRepository.findById(input.periodId);
    if (!existing) {
      throw new FinancialPeriodNotFoundException();
    }
    if (existing.status !== 'LOCKED') {
      throw new FinancialPeriodNotInStatusException('LOCKED');
    }

    const now = new Date();
    const closed = await this.financialPeriodRepository.updateStatus(input.periodId, 'CLOSED', {
      closedBy: input.actorUserId,
      closedAt: now,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'FinancialPeriod',
      input.periodId,
      'UPDATE',
      { status: 'LOCKED' },
      { status: 'CLOSED', closedBy: input.actorUserId },
      auditContext,
    );

    await this.eventBus.publish('finance.period.closed.v1', {
      periodId: closed.id,
      branchId: closed.branchId,
      closedBy: input.actorUserId,
      closedAt: now.toISOString(),
    });

    return toFinancialPeriodResponseDto(closed);
  }
}
