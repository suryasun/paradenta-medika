import { IProvinceRepository } from '../../../master-data/domain/repositories/IProvinceRepository';
import { IRegencyRepository } from '../../../master-data/domain/repositories/IRegencyRepository';
import { IDistrictRepository } from '../../../master-data/domain/repositories/IDistrictRepository';
import { IVillageRepository } from '../../../master-data/domain/repositories/IVillageRepository';
import { PatientAddressRegionMismatchException } from '../../domain/exceptions/PatientExceptions';

export interface RegionChainInput {
  provinceId: string;
  regencyId: string;
  districtId: string;
  villageId: string;
}

/**
 * task-286 Acceptance Criteria: "the API rejects a provinceId/regencyId/
 * districtId/villageId that doesn't exist or whose parent chain doesn't
 * match (e.g. a villageId that doesn't actually belong to the given
 * districtId)." Consumes Master Data's published repository interfaces
 * only (docs/04-ai-contract/07-module-contract.md MOD-003) -- Patient
 * never queries provinces/regencies/districts/villages directly.
 */
export class PatientAddressRegionValidator {
  constructor(
    private readonly provinceRepository: IProvinceRepository,
    private readonly regencyRepository: IRegencyRepository,
    private readonly districtRepository: IDistrictRepository,
    private readonly villageRepository: IVillageRepository,
  ) {}

  async validate(input: RegionChainInput): Promise<void> {
    const village = await this.villageRepository.findById(input.villageId);
    if (!village || !village.isActive) {
      throw new PatientAddressRegionMismatchException('villageId does not exist or is not active');
    }
    if (village.districtId !== input.districtId) {
      throw new PatientAddressRegionMismatchException('villageId does not belong to the given districtId');
    }

    const district = await this.districtRepository.findById(input.districtId);
    if (!district || !district.isActive) {
      throw new PatientAddressRegionMismatchException('districtId does not exist or is not active');
    }
    if (district.regencyId !== input.regencyId) {
      throw new PatientAddressRegionMismatchException('districtId does not belong to the given regencyId');
    }

    const regency = await this.regencyRepository.findById(input.regencyId);
    if (!regency || !regency.isActive) {
      throw new PatientAddressRegionMismatchException('regencyId does not exist or is not active');
    }
    if (regency.provinceId !== input.provinceId) {
      throw new PatientAddressRegionMismatchException('regencyId does not belong to the given provinceId');
    }

    const province = await this.provinceRepository.findById(input.provinceId);
    if (!province || !province.isActive) {
      throw new PatientAddressRegionMismatchException('provinceId does not exist or is not active');
    }
  }
}
