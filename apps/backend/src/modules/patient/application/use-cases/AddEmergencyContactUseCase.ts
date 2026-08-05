import { PatientEmergencyContact } from '@prisma/client';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IPatientEmergencyContactRepository } from '../../domain/repositories/IPatientEmergencyContactRepository';

export interface AddEmergencyContactInput {
  patientId: string;
  contactName: string;
  relationship: string;
  phone: string;
  address?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export class AddEmergencyContactUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly patientEmergencyContactRepository: IPatientEmergencyContactRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: AddEmergencyContactInput): Promise<PatientEmergencyContact> {
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }

    const contact = await this.patientEmergencyContactRepository.create({
      patientId: input.patientId,
      contactName: input.contactName,
      relationship: input.relationship,
      phone: input.phone,
      address: input.address,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('PatientEmergencyContact', contact.id, 'CREATE', null, { patientId: input.patientId }, auditContext);

    return contact;
  }
}
