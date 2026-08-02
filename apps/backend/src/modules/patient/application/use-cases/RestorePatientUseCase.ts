import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';
import { PATIENT_RESTORED_EVENT, PatientLifecyclePayload } from '../../domain/events/PatientEvents';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientResponseDto } from '../dtos/PatientResponseDto';
import { toPatientResponse } from '../mappers/PatientMapper';

export interface RestorePatientInput {
  patientId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export class RestorePatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: RestorePatientInput): Promise<PatientResponseDto> {
    const existing = await this.patientRepository.findById(input.patientId);
    if (!existing) {
      throw new PatientNotFoundException();
    }

    const restored = await this.patientRepository.restore(input.patientId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Patient', restored.id, 'UPDATE', { active: false }, { active: true }, auditContext);

    const eventPayload: PatientLifecyclePayload = {
      event: PATIENT_RESTORED_EVENT,
      patientId: restored.id,
      medicalRecordNumber: restored.medicalRecordNo,
      occurredAt: new Date().toISOString(),
    };
    await this.eventBus.publish(PATIENT_RESTORED_EVENT, eventPayload);

    return toPatientResponse(restored);
  }
}
