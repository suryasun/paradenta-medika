import { IEventBus } from '../../../../shared/events/EventBus';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { QueueNotFoundException } from '../../domain/exceptions/QueueExceptions';
import { IQueueHistoryRepository } from '../../domain/repositories/IQueueHistoryRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { assertQueueTransition } from '../services/queueTransitions';
import { performQueueTransition } from '../services/performQueueTransition';
import { QueueResponseDto } from '../dtos/QueueResponseDto';
import { toQueueResponse } from '../mappers/QueueMapper';

export interface StartServiceInput {
  queueId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-043.md: CALLED -> IN_SERVICE. */
export class StartServiceUseCase {
  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly historyRepository: IQueueHistoryRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: StartServiceInput): Promise<QueueResponseDto> {
    const queue = await this.queueRepository.findById(input.queueId);
    if (!queue) {
      throw new QueueNotFoundException();
    }
    assertQueueTransition(queue.status, ['CALLED']);

    const updated = await performQueueTransition(this.queueRepository, this.historyRepository, this.auditService, this.eventBus, {
      queue,
      newStatus: 'IN_SERVICE',
      timestampField: 'startedAt',
      actorUserId: input.actorUserId,
      ipAddress: input.ipAddress,
      correlationId: input.correlationId,
    });

    return toQueueResponse(updated);
  }
}
