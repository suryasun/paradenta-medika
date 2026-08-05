import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { IPatientAddressRepository } from '../../domain/repositories/IPatientAddressRepository';
import { PatientAddressRegionValidator } from '../services/PatientAddressRegionValidator';
import { PatientAddressMapper } from '../mappers/PatientAddressMapper';
import { PatientAddressResponseDto } from '../dtos/PatientAddressResponseDto';

export interface AddPatientAddressInput {
  patientId: string;
  provinceId: string;
  regencyId: string;
  districtId: string;
  villageId: string;
  addressLine: string;
  postalCode?: string;
  isPrimary?: boolean;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * task-286: a patient's very first address is always primary regardless
 * of what the caller passes (task's own AC: "exactly one is flagged
 * primary when at least one exists"); adding a second+ address does NOT
 * silently unset the current primary unless isPrimary:true is explicitly
 * requested.
 */
export class AddPatientAddressUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly patientAddressRepository: IPatientAddressRepository,
    private readonly regionValidator: PatientAddressRegionValidator,
    private readonly mapper: PatientAddressMapper,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: AddPatientAddressInput): Promise<PatientAddressResponseDto> {
    const patient = await this.patientRepository.findById(input.patientId);
    if (!patient) {
      throw new PatientNotFoundException();
    }

    await this.regionValidator.validate(input);

    const existingCount = await this.patientAddressRepository.countForPatient(input.patientId);
    const shouldBePrimary = existingCount === 0 || Boolean(input.isPrimary);

    const created = await this.patientAddressRepository.create({
      patientId: input.patientId,
      provinceId: input.provinceId,
      regencyId: input.regencyId,
      districtId: input.districtId,
      villageId: input.villageId,
      addressLine: input.addressLine,
      postalCode: input.postalCode,
      isPrimary: false,
    });

    const finalAddress = shouldBePrimary
      ? await this.patientAddressRepository.setPrimary(input.patientId, created.id)
      : created;

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'PatientAddress',
      finalAddress.id,
      'CREATE',
      null,
      { patientId: input.patientId, isPrimary: finalAddress.isPrimary },
      auditContext,
    );

    return this.mapper.toResponse(finalAddress);
  }
}
