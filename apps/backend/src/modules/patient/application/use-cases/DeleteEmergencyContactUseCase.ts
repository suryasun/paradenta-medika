import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PatientEmergencyContactNotFoundException } from '../../domain/exceptions/PatientExceptions';
import { IPatientEmergencyContactRepository } from '../../domain/repositories/IPatientEmergencyContactRepository';

export interface DeleteEmergencyContactInput {
  patientId: string;
  contactId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export class DeleteEmergencyContactUseCase {
  constructor(
    private readonly patientEmergencyContactRepository: IPatientEmergencyContactRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: DeleteEmergencyContactInput): Promise<void> {
    const existing = await this.patientEmergencyContactRepository.findById(input.contactId);
    if (!existing || existing.patientId !== input.patientId) {
      throw new PatientEmergencyContactNotFoundException();
    }

    await this.patientEmergencyContactRepository.delete(input.contactId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('PatientEmergencyContact', input.contactId, 'DELETE', existing, null, auditContext);
  }
}
