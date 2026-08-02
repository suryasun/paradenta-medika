import { IEventBus } from '../../../../shared/events/EventBus';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { QueueNotFoundException } from '../../domain/exceptions/QueueExceptions';
import { IQueueHistoryRepository } from '../../domain/repositories/IQueueHistoryRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { assertQueueTransition } from '../services/queueTransitions';
import { performQueueTransition } from '../services/performQueueTransition';
import { QueueResponseDto } from '../dtos/QueueResponseDto';
import { toQueueResponse } from '../mappers/QueueMapper';

export interface SkipQueueInput {
  queueId: string;
  reason?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-042.md explicitly defers to
 * docs/03-sad/14-module-queue.md Section 23's exact transition table:
 * WAITING -> SKIPPED (not CALLED -> SKIPPED, as the task's own prose
 * speculated). A skipped entry can be called again (SKIPPED -> CALLED,
 * see CallQueueUseCase) so it remains selectable, matching task-042's AC
 * that skipped entries stay visible and callable.
 */
export class SkipQueueUseCase {
  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly historyRepository: IQueueHistoryRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: SkipQueueInput): Promise<QueueResponseDto> {
    const queue = await this.queueRepository.findById(input.queueId);
    if (!queue) {
      throw new QueueNotFoundException();
    }
    assertQueueTransition(queue.status, ['WAITING']);

    const updated = await performQueueTransition(this.queueRepository, this.historyRepository, this.auditService, this.eventBus, {
      queue,
      newStatus: 'SKIPPED',
      timestampField: null,
      reason: input.reason,
      actorUserId: input.actorUserId,
      ipAddress: input.ipAddress,
      correlationId: input.correlationId,
    });

    return toQueueResponse(updated);
  }
}
