/**
 * docs/06-tasks/task-037.md/task-040.md + docs/03-sad/14-module-queue.md
 * Section 61 Domain Events.
 */
export const QUEUE_CREATED_EVENT = 'QueueCreated';
export const QUEUE_CALLED_EVENT = 'QueueCalled';
export const QUEUE_COMPLETED_EVENT = 'QueueCompleted';

export interface QueueEventPayload {
  event: string;
  queueId: string;
  queueNumber: string;
  patientId: string;
  doctorId: string;
  branchId: string;
  status: string;
  occurredAt: string;
}
