import { Queue } from '@prisma/client';
import { QueueResponseDto } from '../dtos/QueueResponseDto';

export function toQueueResponse(queue: Queue): QueueResponseDto {
  return {
    id: queue.id,
    queueNumber: queue.queueNumber,
    branchId: queue.branchId,
    patientId: queue.patientId,
    doctorId: queue.doctorId,
    reservationId: queue.reservationId,
    queueDate: queue.queueDate.toISOString().slice(0, 10),
    queueType: queue.queueType,
    priority: queue.priority,
    status: queue.status,
    checkedInAt: queue.checkedInAt.toISOString(),
    calledAt: queue.calledAt ? queue.calledAt.toISOString() : null,
    startedAt: queue.startedAt ? queue.startedAt.toISOString() : null,
    completedAt: queue.completedAt ? queue.completedAt.toISOString() : null,
    cancelledAt: queue.cancelledAt ? queue.cancelledAt.toISOString() : null,
    notes: queue.notes,
  };
}
