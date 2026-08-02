import { QueueCall } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IQueueCallRepository } from '../../domain/repositories/IQueueCallRepository';

export class QueueCallRepository implements IQueueCallRepository {
  async recordCall(queueId: string, calledBy: string): Promise<QueueCall> {
    const recallNumber = await this.countCallsForQueue(queueId);
    return prisma.queueCall.create({
      data: { queueId, calledBy, recallNumber: recallNumber + 1 },
    });
  }

  async countCallsForQueue(queueId: string): Promise<number> {
    return prisma.queueCall.count({ where: { queueId } });
  }
}
