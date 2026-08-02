import { IEventBus } from '../../../../shared/events/EventBus';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { QueueNotFoundException } from '../../domain/exceptions/QueueExceptions';
import { IQueueHistoryRepository } from '../../domain/repositories/IQueueHistoryRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { assertQueueTransition } from '../services/queueTransitions';
import { performQueueTransition } from '../services/performQueueTransition';
import { QueueResponseDto } from '../dtos/QueueResponseDto';
import { toQueueResponse } from '../mappers/QueueMapper';

export interface CancelQueueInput {
  queueId: string;
  reason?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-045.md says Cancel is allowed from "WAITING/CALLED";
 * docs/03-sad/14-module-queue.md Section 23's authoritative transition
 * diagram only shows WAITING -> CANCELLED. Followed the diagram (see
 * queueTransitions.ts for the full reasoning) -- Cancel is WAITING-only.
 */
export class CancelQueueUseCase {
  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly historyRepository: IQueueHistoryRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CancelQueueInput): Promise<QueueResponseDto> {
    const queue = await this.queueRepository.findById(input.queueId);
    if (!queue) {
      throw new QueueNotFoundException();
    }
    assertQueueTransition(queue.status, ['WAITING']);

    const updated = await performQueueTransition(this.queueRepository, this.historyRepository, this.auditService, this.eventBus, {
      queue,
      newStatus: 'CANCELLED',
      timestampField: 'cancelledAt',
      reason: input.reason,
      actorUserId: input.actorUserId,
      ipAddress: input.ipAddress,
      correlationId: input.correlationId,
    });

    return toQueueResponse(updated);
  }
}
