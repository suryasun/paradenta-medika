import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PatientAddressNotFoundException } from '../../domain/exceptions/PatientExceptions';
import { IPatientAddressRepository } from '../../domain/repositories/IPatientAddressRepository';
import { PatientAddressMapper } from '../mappers/PatientAddressMapper';
import { PatientAddressResponseDto } from '../dtos/PatientAddressResponseDto';

export interface SetPrimaryPatientAddressInput {
  patientId: string;
  addressId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** task-286: explicitly promoting a different address atomically demotes whatever was primary before. */
export class SetPrimaryPatientAddressUseCase {
  constructor(
    private readonly patientAddressRepository: IPatientAddressRepository,
    private readonly mapper: PatientAddressMapper,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: SetPrimaryPatientAddressInput): Promise<PatientAddressResponseDto> {
    const existing = await this.patientAddressRepository.findById(input.addressId);
    if (!existing || existing.patientId !== input.patientId) {
      throw new PatientAddressNotFoundException();
    }

    const updated = await this.patientAddressRepository.setPrimary(input.patientId, input.addressId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'PatientAddress',
      updated.id,
      'UPDATE',
      { isPrimary: existing.isPrimary },
      { isPrimary: true },
      auditContext,
    );

    return this.mapper.toResponse(updated);
  }
}
