import { UpdatePatientAddressUseCase } from './UpdatePatientAddressUseCase';
import { PatientAddressRegionValidator } from '../services/PatientAddressRegionValidator';
import { PatientAddressMapper } from '../mappers/PatientAddressMapper';
import { FakePatientAddressRepository } from '../../../../../tests/fakes/patientFakes';
import {
  FakeDistrictRepository,
  FakeProvinceRepository,
  FakeRegencyRepository,
  FakeVillageRepository,
} from '../../../../../tests/fakes/masterDataFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PatientAddressNotFoundException, PatientAddressPrimaryRequiredException } from '../../domain/exceptions/PatientExceptions';

const PROVINCE_ID = '11111111-1111-4111-8111-111111111111';
const REGENCY_ID = '22222222-2222-4222-8222-222222222222';
const DISTRICT_ID = '33333333-3333-4333-8333-333333333333';
const VILLAGE_ID = '44444444-4444-4444-8444-444444444444';

function buildSut() {
  const patientAddressRepository = new FakePatientAddressRepository();
  const provinceRepository = new FakeProvinceRepository();
  provinceRepository.items = [{ id: PROVINCE_ID, provinceCode: 'DKI', provinceName: 'DKI Jakarta', isActive: true }];
  const regencyRepository = new FakeRegencyRepository();
  regencyRepository.items = [{ id: REGENCY_ID, provinceId: PROVINCE_ID, regencyCode: 'JKT-SEL', regencyName: 'Jakarta Selatan', isActive: true }];
  const districtRepository = new FakeDistrictRepository();
  districtRepository.items = [{ id: DISTRICT_ID, regencyId: REGENCY_ID, districtCode: 'KBY', districtName: 'Kebayoran Baru', isActive: true }];
  const villageRepository = new FakeVillageRepository();
  villageRepository.items = [
    { id: VILLAGE_ID, districtId: DISTRICT_ID, villageCode: 'GNDR', villageName: 'Gandaria Utara', postalCode: '12140', isActive: true },
  ];
  const regionValidator = new PatientAddressRegionValidator(provinceRepository, regencyRepository, districtRepository, villageRepository);
  const mapper = new PatientAddressMapper(provinceRepository, regencyRepository, districtRepository, villageRepository);
  const auditService = new FakeAuditService();
  const useCase = new UpdatePatientAddressUseCase(patientAddressRepository, regionValidator, mapper, auditService);
  return { useCase, patientAddressRepository };
}

function addressProps(patientId: string, overrides: Partial<{ addressLine: string; isPrimary: boolean }> = {}) {
  return {
    patientId,
    provinceId: PROVINCE_ID,
    regencyId: REGENCY_ID,
    districtId: DISTRICT_ID,
    villageId: VILLAGE_ID,
    addressLine: overrides.addressLine ?? 'Jl. Contoh',
    isPrimary: overrides.isPrimary ?? false,
  };
}

describe('UpdatePatientAddressUseCase', () => {
  it('updates addressLine/postalCode without touching isPrimary', async () => {
    const { useCase, patientAddressRepository } = buildSut();
    const address = await patientAddressRepository.create(addressProps('p1', { isPrimary: true }));

    const result = await useCase.execute({
      patientId: 'p1',
      addressId: address.id,
      addressLine: 'Jl. Baru No. 1',
      postalCode: '12345',
      actorUserId: 'staff-1',
    });

    expect(result.addressLine).toBe('Jl. Baru No. 1');
    expect(result.postalCode).toBe('12345');
    expect(result.isPrimary).toBe(true);
  });

  it('setting isPrimary:true promotes this address and demotes the previous primary', async () => {
    const { useCase, patientAddressRepository } = buildSut();
    const primary = await patientAddressRepository.create(addressProps('p1', { isPrimary: true }));
    const other = await patientAddressRepository.create(addressProps('p1', { addressLine: 'Jl. Kedua' }));

    const result = await useCase.execute({ patientId: 'p1', addressId: other.id, isPrimary: true, actorUserId: 'staff-1' });

    expect(result.isPrimary).toBe(true);
    expect((await patientAddressRepository.findById(primary.id))?.isPrimary).toBe(false);
  });

  it('rejects explicitly unsetting isPrimary:false on the current primary address', async () => {
    const { useCase, patientAddressRepository } = buildSut();
    const primary = await patientAddressRepository.create(addressProps('p1', { isPrimary: true }));

    await expect(
      useCase.execute({ patientId: 'p1', addressId: primary.id, isPrimary: false, actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(PatientAddressPrimaryRequiredException);
  });

  it('rejects updating an address belonging to a different patient', async () => {
    const { useCase, patientAddressRepository } = buildSut();
    const address = await patientAddressRepository.create(addressProps('p1'));

    await expect(
      useCase.execute({ patientId: 'other-patient', addressId: address.id, addressLine: 'X', actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(PatientAddressNotFoundException);
  });

  it('rejects updating to a villageId that does not belong to the given districtId', async () => {
    const { useCase, patientAddressRepository } = buildSut();
    const address = await patientAddressRepository.create(addressProps('p1'));

    await expect(
      useCase.execute({
        patientId: 'p1',
        addressId: address.id,
        districtId: '99999999-9999-4999-8999-999999999999',
        actorUserId: 'staff-1',
      }),
    ).rejects.toMatchObject({ code: 'PATIENT_ADDRESS_REGION_MISMATCH' });
  });
});
