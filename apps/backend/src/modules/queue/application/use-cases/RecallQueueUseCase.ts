import { QueueNotFoundException } from '../../domain/exceptions/QueueExceptions';
import { IQueueCallRepository } from '../../domain/repositories/IQueueCallRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { assertQueueTransition } from '../services/queueTransitions';
import { QueueResponseDto } from '../dtos/QueueResponseDto';
import { toQueueResponse } from '../mappers/QueueMapper';

export interface RecallQueueInput {
  queueId: string;
  actorUserId: string;
}

/**
 * docs/06-tasks/task-041.md: re-announce a CALLED patient without changing
 * queue order or status -- not a state transition in Section 23's diagram,
 * so this only records another docs/03-sad/14-module-queue.md Section 54
 * queue_calls entry (recall_number increments) and requires the queue to
 * currently be CALLED.
 */
export class RecallQueueUseCase {
  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly callRepository: IQueueCallRepository,
  ) {}

  async execute(input: RecallQueueInput): Promise<QueueResponseDto> {
    const queue = await this.queueRepository.findById(input.queueId);
    if (!queue) {
      throw new QueueNotFoundException();
    }
    assertQueueTransition(queue.status, ['CALLED']);

    await this.callRepository.recordCall(queue.id, input.actorUserId);

    return toQueueResponse(queue);
  }
}
