import { PatientEmergencyContact } from '@prisma/client';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PatientEmergencyContactNotFoundException } from '../../domain/exceptions/PatientExceptions';
import { IPatientEmergencyContactRepository } from '../../domain/repositories/IPatientEmergencyContactRepository';

export interface UpdateEmergencyContactInput {
  patientId: string;
  contactId: string;
  contactName?: string;
  relationship?: string;
  phone?: string;
  address?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export class UpdateEmergencyContactUseCase {
  constructor(
    private readonly patientEmergencyContactRepository: IPatientEmergencyContactRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: UpdateEmergencyContactInput): Promise<PatientEmergencyContact> {
    const existing = await this.patientEmergencyContactRepository.findById(input.contactId);
    if (!existing || existing.patientId !== input.patientId) {
      throw new PatientEmergencyContactNotFoundException();
    }

    const updated = await this.patientEmergencyContactRepository.update(input.contactId, {
      contactName: input.contactName,
      relationship: input.relationship,
      phone: input.phone,
      address: input.address,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('PatientEmergencyContact', updated.id, 'UPDATE', existing, updated, auditContext);

    return updated;
  }
}
