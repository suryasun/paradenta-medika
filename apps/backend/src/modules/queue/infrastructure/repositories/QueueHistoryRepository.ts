import { prisma } from '../../../../shared/infrastructure/prisma';
import { AppendQueueHistoryInput, IQueueHistoryRepository } from '../../domain/repositories/IQueueHistoryRepository';

export class QueueHistoryRepository implements IQueueHistoryRepository {
  async append(input: AppendQueueHistoryInput): Promise<void> {
    await prisma.queueHistory.create({
      data: {
        queueId: input.queueId,
        previousStatus: input.previousStatus,
        currentStatus: input.currentStatus,
        reason: input.reason,
        changedBy: input.changedBy,
      },
    });
  }
}
