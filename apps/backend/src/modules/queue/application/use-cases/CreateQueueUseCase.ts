import { ConflictException } from '../../../../shared/http/exceptions';
import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { IDoctorRepository } from '../../../master-data/domain/repositories/IDoctorRepository';
import { IPatientRepository } from '../../../patient/domain/repositories/IPatientRepository';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';
import { PatientAlreadyHasActiveQueueException } from '../../domain/exceptions/QueueExceptions';
import { QUEUE_CREATED_EVENT, QueueEventPayload } from '../../domain/events/QueueEvents';
import { IQueueRepository } from '../../domain/repositories/IQueueRepository';
import { QueueNumberGenerator } from '../services/QueueNumberGenerator';
import { QueueResponseDto } from '../dtos/QueueResponseDto';
import { toQueueResponse } from '../mappers/QueueMapper';

export interface CreateQueueInput {
  patientId: string;
  doctorId: string;
  reservationId?: string;
  isEmergency?: boolean;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-037.md + docs/03-sad/14-module-queue.md Section 17
 * (Queue Numbering Strategy) / Section 21 Business Rules.
 */
export class CreateQueueUseCase {
  constructor(
    private readonly queueRepository: IQueueRepository,
    private readonly patientRepository: IPatientRepository,
    private readonly doctorRepository: IDoctorRepository,
    private readonly queueNumberGenerator: QueueNumberGenerator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CreateQueueInput): Promise<QueueResponseDto> {
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient || !patient.active) {
      throw new PatientNotFoundException();
    }

    const doctor = await this.doctorRepository.findById(input.doctorId);
    if (!doctor || !doctor.isActive) {
      throw new ConflictException('Doctor is not active');
    }

    if (input.reservationId) {
      const existingForReservation = await this.queueRepository.findByReservationId(input.reservationId);
      if (existingForReservation) {
        throw new ConflictException('A queue entry already exists for this reservation');
      }
    }

    const today = new Date();
    const queueDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

    const activeCount = await this.queueRepository.countActiveForPatientOnDate(input.patientId, doctor.branchId, queueDate);
    if (activeCount > 0) {
      throw new PatientAlreadyHasActiveQueueException();
    }

    const { queueNumber, queuePrefix } = await this.queueNumberGenerator.generate(doctor.branchId, queueDate);

    const queue = await this.queueRepository.create({
      reservationId: input.reservationId,
      branchId: doctor.branchId,
      patientId: input.patientId,
      doctorId: input.doctorId,
      queueNumber,
      queuePrefix,
      queueDate,
      queueType: input.isEmergency ? 'EMERGENCY' : input.reservationId ? 'RESERVATION' : 'WALK_IN',
      priority: input.isEmergency ? 'EMERGENCY' : 'NORMAL',
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Queue', queue.id, 'CREATE', null, { queueNumber, patientId: input.patientId, doctorId: input.doctorId }, auditContext);

    const eventPayload: QueueEventPayload = {
      event: QUEUE_CREATED_EVENT,
      queueId: queue.id,
      queueNumber: queue.queueNumber,
      patientId: queue.patientId,
      doctorId: queue.doctorId,
      branchId: queue.branchId,
      status: queue.status,
      occurredAt: queue.createdAt.toISOString(),
    };
    await this.eventBus.publish(QUEUE_CREATED_EVENT, eventPayload);

    return toQueueResponse(queue);
  }
}
