import { PatientAddress } from '@prisma/client';
import { IProvinceRepository } from '../../../master-data/domain/repositories/IProvinceRepository';
import { IRegencyRepository } from '../../../master-data/domain/repositories/IRegencyRepository';
import { IDistrictRepository } from '../../../master-data/domain/repositories/IDistrictRepository';
import { IVillageRepository } from '../../../master-data/domain/repositories/IVillageRepository';
import { PatientAddressResponseDto } from '../dtos/PatientAddressResponseDto';

// task-286: resolves each FK to its display name via Master Data's
// published repositories so the frontend's address cards don't need a
// second round trip just to render readable labels.
export class PatientAddressMapper {
  constructor(
    private readonly provinceRepository: IProvinceRepository,
    private readonly regencyRepository: IRegencyRepository,
    private readonly districtRepository: IDistrictRepository,
    private readonly villageRepository: IVillageRepository,
  ) {}

  async toResponse(address: PatientAddress): Promise<PatientAddressResponseDto> {
    const [province, regency, district, village] = await Promise.all([
      this.provinceRepository.findById(address.provinceId),
      this.regencyRepository.findById(address.regencyId),
      this.districtRepository.findById(address.districtId),
      this.villageRepository.findById(address.villageId),
    ]);
    return {
      id: address.id,
      province: { id: address.provinceId, name: province?.provinceName ?? '' },
      regency: { id: address.regencyId, name: regency?.regencyName ?? '' },
      district: { id: address.districtId, name: district?.districtName ?? '' },
      village: { id: address.villageId, name: village?.villageName ?? '' },
      addressLine: address.addressLine,
      postalCode: address.postalCode,
      isPrimary: address.isPrimary,
    };
  }

  async toResponseList(addresses: PatientAddress[]): Promise<PatientAddressResponseDto[]> {
    return Promise.all(addresses.map((address) => this.toResponse(address)));
  }
}
