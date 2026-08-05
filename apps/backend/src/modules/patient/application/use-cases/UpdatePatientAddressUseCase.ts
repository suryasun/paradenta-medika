import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PatientAddressNotFoundException, PatientAddressPrimaryRequiredException } from '../../domain/exceptions/PatientExceptions';
import { IPatientAddressRepository } from '../../domain/repositories/IPatientAddressRepository';
import { PatientAddressRegionValidator } from '../services/PatientAddressRegionValidator';
import { PatientAddressMapper } from '../mappers/PatientAddressMapper';
import { PatientAddressResponseDto } from '../dtos/PatientAddressResponseDto';

export interface UpdatePatientAddressInput {
  patientId: string;
  addressId: string;
  provinceId?: string;
  regencyId?: string;
  districtId?: string;
  villageId?: string;
  addressLine?: string;
  postalCode?: string;
  isPrimary?: boolean;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * task-286: `isPrimary: true` promotes this address (atomically demoting
 * whatever was primary before). `isPrimary: false` on the current primary
 * is rejected outright -- unsetting the sole primary without designating
 * a replacement would violate "exactly one primary when at least one
 * address exists"; callers should set a different address primary
 * instead (which demotes this one as a side effect).
 */
export class UpdatePatientAddressUseCase {
  constructor(
    private readonly patientAddressRepository: IPatientAddressRepository,
    private readonly regionValidator: PatientAddressRegionValidator,
    private readonly mapper: PatientAddressMapper,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: UpdatePatientAddressInput): Promise<PatientAddressResponseDto> {
    const existing = await this.patientAddressRepository.findById(input.addressId);
    if (!existing || existing.patientId !== input.patientId) {
      throw new PatientAddressNotFoundException();
    }

    if (input.isPrimary === false && existing.isPrimary) {
      throw new PatientAddressPrimaryRequiredException();
    }

    const regionChanged =
      input.provinceId !== undefined ||
      input.regencyId !== undefined ||
      input.districtId !== undefined ||
      input.villageId !== undefined;
    if (regionChanged) {
      await this.regionValidator.validate({
        provinceId: input.provinceId ?? existing.provinceId,
        regencyId: input.regencyId ?? existing.regencyId,
        districtId: input.districtId ?? existing.districtId,
        villageId: input.villageId ?? existing.villageId,
      });
    }

    const updated = await this.patientAddressRepository.update(input.addressId, {
      provinceId: input.provinceId,
      regencyId: input.regencyId,
      districtId: input.districtId,
      villageId: input.villageId,
      addressLine: input.addressLine,
      postalCode: input.postalCode,
    });

    const finalAddress =
      input.isPrimary === true && !existing.isPrimary
        ? await this.patientAddressRepository.setPrimary(input.patientId, input.addressId)
        : updated;

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('PatientAddress', finalAddress.id, 'UPDATE', existing, finalAddress, auditContext);

    return this.mapper.toResponse(finalAddress);
  }
}
