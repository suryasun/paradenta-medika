import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PatientAddressNotFoundException, PatientAddressPrimaryRequiredException } from '../../domain/exceptions/PatientExceptions';
import { IPatientAddressRepository } from '../../domain/repositories/IPatientAddressRepository';

export interface DeletePatientAddressInput {
  patientId: string;
  addressId: string;
  /** Required only when deleting the primary address while other addresses remain. */
  newPrimaryAddressId?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * task-286 Testing Required: "deleting the primary address when other
 * addresses exist requires the caller to designate a new primary" --
 * deleting a non-primary address, or the sole remaining address (leaving
 * the patient with zero, which is an allowed state), needs no such flag.
 */
export class DeletePatientAddressUseCase {
  constructor(
    private readonly patientAddressRepository: IPatientAddressRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: DeletePatientAddressInput): Promise<void> {
    const existing = await this.patientAddressRepository.findById(input.addressId);
    if (!existing || existing.patientId !== input.patientId) {
      throw new PatientAddressNotFoundException();
    }

    const totalCount = await this.patientAddressRepository.countForPatient(input.patientId);
    const remainingCount = totalCount - 1;

    if (existing.isPrimary && remainingCount > 0) {
      if (!input.newPrimaryAddressId) {
        throw new PatientAddressPrimaryRequiredException();
      }
      const newPrimary = await this.patientAddressRepository.findById(input.newPrimaryAddressId);
      if (!newPrimary || newPrimary.patientId !== input.patientId || newPrimary.id === input.addressId) {
        throw new PatientAddressNotFoundException();
      }
      await this.patientAddressRepository.setPrimary(input.patientId, newPrimary.id);
    }

    await this.patientAddressRepository.delete(input.addressId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('PatientAddress', input.addressId, 'DELETE', existing, null, auditContext);
  }
}
