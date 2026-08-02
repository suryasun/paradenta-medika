import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';
import { PATIENT_ARCHIVED_EVENT, PatientLifecyclePayload } from '../../domain/events/PatientEvents';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientResponseDto } from '../dtos/PatientResponseDto';
import { toPatientResponse } from '../mappers/PatientMapper';

export interface ArchivePatientInput {
  patientId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export class ArchivePatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: ArchivePatientInput): Promise<PatientResponseDto> {
    const existing = await this.patientRepository.findById(input.patientId);
    if (!existing) {
      throw new PatientNotFoundException();
    }

    const archived = await this.patientRepository.archive(input.patientId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Patient', archived.id, 'UPDATE', { active: true }, { active: false }, auditContext);

    const eventPayload: PatientLifecyclePayload = {
      event: PATIENT_ARCHIVED_EVENT,
      patientId: archived.id,
      medicalRecordNumber: archived.medicalRecordNo,
      occurredAt: new Date().toISOString(),
    };
    await this.eventBus.publish(PATIENT_ARCHIVED_EVENT, eventPayload);

    return toPatientResponse(archived);
  }
}
