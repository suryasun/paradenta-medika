import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IDoctorRepository } from '../../../master-data/domain/repositories/IDoctorRepository';
import { ConflictException } from '../../../../shared/http/exceptions';
import { InvalidQueueTransitionException, QueueNotFoundException } from '../../domain/exceptions/QueueExceptions';
import { IQueueHistoryRepository } from '../../domain/repositories/IQueueHistoryRepository';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { QueueResponseDto } from '../dtos/QueueResponseDto';
import { toQueueResponse } from '../mappers/QueueMapper';

export interface TransferQueueInput {
  queueId: string;
  doctorId: string;
  reason: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-046.md: reassigns doctorId. Not itself a status
 * transition in Section 23's diagram, so it is not state-machine
 * constrained there; restricted to WAITING/CALLED/SKIPPED (not yet
 * in-service) as a reasonable operational limit -- the SAD does not state
 * this explicitly, flagged as a judgment call.
 */
export class TransferQueueUseCase {
  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly doctorRepository: IDoctorRepository,
    private readonly historyRepository: IQueueHistoryRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: TransferQueueInput): Promise<QueueResponseDto> {
    const queue = await this.queueRepository.findById(input.queueId);
    if (!queue) {
      throw new QueueNotFoundException();
    }
    if (!['WAITING', 'CALLED', 'SKIPPED'].includes(queue.status)) {
      throw new InvalidQueueTransitionException(`Queue in status ${queue.status} cannot be transferred`);
    }

    const doctor = await this.doctorRepository.findById(input.doctorId);
    if (!doctor || !doctor.isActive) {
      throw new ConflictException('Target doctor is not active');
    }

    const updated = await this.queueRepository.updateDoctor(input.queueId, input.doctorId, input.actorUserId);

    await this.historyRepository.append({
      queueId: updated.id,
      previousStatus: queue.status,
      currentStatus: updated.status,
      reason: input.reason,
      changedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Queue',
      updated.id,
      'UPDATE',
      { doctorId: queue.doctorId },
      { doctorId: updated.doctorId, reason: input.reason },
      auditContext,
    );

    return toQueueResponse(updated);
  }
}
