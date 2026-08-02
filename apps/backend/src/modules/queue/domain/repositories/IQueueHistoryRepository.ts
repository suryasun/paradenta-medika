export interface AppendQueueHistoryInput {
  queueId: string;
  previousStatus: string | null;
  currentStatus: string;
  reason?: string;
  changedBy: string;
}

export interface IQueueHistoryRepository {
  append(input: AppendQueueHistoryInput): Promise<void>;
}
