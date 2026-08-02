import { IEventBus } from '../../../../shared/events/EventBus';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { QueueNotFoundException } from '../../domain/exceptions/QueueExceptions';
import { QUEUE_CALLED_EVENT } from '../../domain/events/QueueEvents';
import { IQueueCallRepository } from '../../domain/repositories/IQueueCallRepository';
import { IQueueHistoryRepository } from '../../domain/repositories/IQueueHistoryRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { assertQueueTransition } from '../services/queueTransitions';
import { performQueueTransition } from '../services/performQueueTransition';
import { QueueResponseDto } from '../dtos/QueueResponseDto';
import { toQueueResponse } from '../mappers/QueueMapper';

export interface CallQueueInput {
  queueId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-040.md: WAITING -> CALLED (Section 23 also allows
 * SKIPPED -> CALLED, covering a previously-skipped patient being called
 * again). Publishes QueueCalled, which Epic G's Open Visit depends on
 * (docs/03-sad/15-module-emr.md Section 15: "Visit hanya dapat dibuat dari
 * Queue berstatus Called").
 */
export class CallQueueUseCase {
  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly historyRepository: IQueueHistoryRepository,
    private readonly callRepository: IQueueCallRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CallQueueInput): Promise<QueueResponseDto> {
    const queue = await this.queueRepository.findById(input.queueId);
    if (!queue) {
      throw new QueueNotFoundException();
    }
    assertQueueTransition(queue.status, ['WAITING', 'SKIPPED']);

    const updated = await performQueueTransition(this.queueRepository, this.historyRepository, this.auditService, this.eventBus, {
      queue,
      newStatus: 'CALLED',
      timestampField: 'calledAt',
      actorUserId: input.actorUserId,
      ipAddress: input.ipAddress,
      correlationId: input.correlationId,
      eventName: QUEUE_CALLED_EVENT,
    });

    await this.callRepository.recordCall(updated.id, input.actorUserId);

    return toQueueResponse(updated);
  }
}
