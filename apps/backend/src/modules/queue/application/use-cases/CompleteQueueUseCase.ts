import { IEventBus } from '../../../../shared/events/EventBus';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { QueueNotFoundException } from '../../domain/exceptions/QueueExceptions';
import { QUEUE_COMPLETED_EVENT } from '../../domain/events/QueueEvents';
import { IQueueHistoryRepository } from '../../domain/repositories/IQueueHistoryRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { assertQueueTransition } from '../services/queueTransitions';
import { performQueueTransition } from '../services/performQueueTransition';
import { QueueResponseDto } from '../dtos/QueueResponseDto';
import { toQueueResponse } from '../mappers/QueueMapper';

export interface CompleteQueueInput {
  queueId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-044.md: IN_SERVICE -> COMPLETED. Coordination with
 * task-052 (Close Visit) happens in Epic G: Close Visit calls this use
 * case (or the reverse) once EMR exists -- not implemented yet since
 * Epic G hasn't been built.
 */
export class CompleteQueueUseCase {
  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly historyRepository: IQueueHistoryRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CompleteQueueInput): Promise<QueueResponseDto> {
    const queue = await this.queueRepository.findById(input.queueId);
    if (!queue) {
      throw new QueueNotFoundException();
    }
    assertQueueTransition(queue.status, ['IN_SERVICE']);

    const updated = await performQueueTransition(this.queueRepository, this.historyRepository, this.auditService, this.eventBus, {
      queue,
      newStatus: 'COMPLETED',
      timestampField: 'completedAt',
      actorUserId: input.actorUserId,
      ipAddress: input.ipAddress,
      correlationId: input.correlationId,
      eventName: QUEUE_COMPLETED_EVENT,
    });

    return toQueueResponse(updated);
  }
}
