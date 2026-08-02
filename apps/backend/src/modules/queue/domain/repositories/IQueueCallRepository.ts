import { QueueCall } from '@prisma/client';

export interface IQueueCallRepository {
  recordCall(queueId: string, calledBy: string): Promise<QueueCall>;
  countCallsForQueue(queueId: string): Promise<number>;
}
