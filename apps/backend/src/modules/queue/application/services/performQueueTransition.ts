import { Queue } from '@prisma/client';
import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IQueueHistoryRepository } from '../../domain/repositories/IQueueHistoryRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { QueueEventPayload } from '../../domain/events/QueueEvents';

export interface PerformTransitionParams {
  queue: Queue;
  newStatus: string;
  timestampField: 'calledAt' | 'startedAt' | 'completedAt' | 'cancelledAt' | null;
  reason?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
  eventName?: string;
}

/**
 * Shared Update-Status -> Append-History -> Audit -> (optional) Publish
 * sequence reused by Call/Skip/Start/Complete/Cancel -- the state-check
 * itself happens in each use case via assertQueueTransition before calling
 * this, so the shared step here is purely the persistence/side-effect
 * fan-out common to all of them.
 */
export async function performQueueTransition(
  queueRepository: IQueueRepository,
  historyRepository: IQueueHistoryRepository,
  auditService: IAuditService,
  eventBus: IEventBus,
  params: PerformTransitionParams,
): Promise<Queue> {
  const updated = await queueRepository.updateStatus(params.queue.id, params.newStatus, params.timestampField, params.actorUserId);

  await historyRepository.append({
    queueId: updated.id,
    previousStatus: params.queue.status,
    currentStatus: updated.status,
    reason: params.reason,
    changedBy: params.actorUserId,
  });

  const auditContext: AuditContext = { userId: params.actorUserId, ipAddress: params.ipAddress, correlationId: params.correlationId };
  await auditService.record('Queue', updated.id, 'UPDATE', { status: params.queue.status }, { status: updated.status }, auditContext);

  if (params.eventName) {
    const payload: QueueEventPayload = {
      event: params.eventName,
      queueId: updated.id,
      queueNumber: updated.queueNumber,
      patientId: updated.patientId,
      doctorId: updated.doctorId,
      branchId: updated.branchId,
      status: updated.status,
      occurredAt: new Date().toISOString(),
    };
    await eventBus.publish(params.eventName, payload);
  }

  return updated;
}
