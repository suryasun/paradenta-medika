import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  DailyClosingNotFoundException,
  DailyClosingNotInStatusException,
  DailyClosingSegregationOfDutiesException,
} from '../../domain/exceptions/FinanceExceptions';
import { IDailyClosingRepository } from '../../domain/repositories/IDailyClosingRepository';
import { DailyClosingResponseDto } from '../dtos/DailyClosingResponseDto';
import { toDailyClosingResponseDto } from '../mappers/DailyClosingMapper';

export interface ApproveDailyClosingInput {
  closingId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-165.md AC: "Rejects self-approval." Publishes the literal `finance.daily-closing.approved.v1` event (SAD Section 7.3). */
export class ApproveDailyClosingUseCase {
  constructor(
    private readonly dailyClosingRepository: IDailyClosingRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: ApproveDailyClosingInput): Promise<DailyClosingResponseDto> {
    const existing = await this.dailyClosingRepository.findById(input.closingId);
    if (!existing) {
      throw new DailyClosingNotFoundException();
    }
    if (existing.status !== 'SUBMITTED') {
      throw new DailyClosingNotInStatusException('SUBMITTED');
    }
    if (existing.createdBy && existing.createdBy === input.actorUserId) {
      throw new DailyClosingSegregationOfDutiesException();
    }

    const now = new Date();
    const approved = await this.dailyClosingRepository.approve(input.closingId, input.actorUserId, now);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'DailyClosing',
      input.closingId,
      'UPDATE',
      { status: 'SUBMITTED' },
      { status: 'APPROVED', approvedBy: input.actorUserId },
      auditContext,
    );

    await this.eventBus.publish('finance.daily-closing.approved.v1', {
      closingId: approved.id,
      branchId: approved.branchId,
      cashAccountId: approved.cashAccountId,
      approvedBy: input.actorUserId,
      approvedAt: now.toISOString(),
    });

    return toDailyClosingResponseDto(approved);
  }
}
