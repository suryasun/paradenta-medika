import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';
import { PATIENT_UPDATED_EVENT, PatientLifecyclePayload } from '../../domain/events/PatientEvents';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientResponseDto } from '../dtos/PatientResponseDto';
import { toPatientResponse } from '../mappers/PatientMapper';

export interface UpdatePatientInput {
  patientId: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-029.md: re-validates the same fields CreatePatient
 * does (Medical Record Number is never accepted as an updatable field --
 * it is not part of UpdatePatientInput at all, so it cannot be changed).
 */
export class UpdatePatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: UpdatePatientInput): Promise<PatientResponseDto> {
    const existing = await this.patientRepository.findById(input.patientId);
    if (!existing) {
      throw new PatientNotFoundException();
    }

    const updated = await this.patientRepository.update(input.patientId, {
      patientName: input.fullName,
      phone: input.phoneNumber,
      email: input.email,
      address: input.address,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Patient',
      updated.id,
      'UPDATE',
      { patientName: existing.patientName, phone: existing.phone, email: existing.email, address: existing.address },
      { patientName: updated.patientName, phone: updated.phone, email: updated.email, address: updated.address },
      auditContext,
    );

    const eventPayload: PatientLifecyclePayload = {
      event: PATIENT_UPDATED_EVENT,
      patientId: updated.id,
      medicalRecordNumber: updated.medicalRecordNo,
      occurredAt: updated.updatedAt.toISOString(),
    };
    await this.eventBus.publish(PATIENT_UPDATED_EVENT, eventPayload);

    return toPatientResponse(updated);
  }
}
