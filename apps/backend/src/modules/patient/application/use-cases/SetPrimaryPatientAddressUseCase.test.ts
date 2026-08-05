import { SetPrimaryPatientAddressUseCase } from './SetPrimaryPatientAddressUseCase';
import { PatientAddressMapper } from '../mappers/PatientAddressMapper';
import { FakePatientAddressRepository } from '../../../../../tests/fakes/patientFakes';
import {
  FakeDistrictRepository,
  FakeProvinceRepository,
  FakeRegencyRepository,
  FakeVillageRepository,
} from '../../../../../tests/fakes/masterDataFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PatientAddressNotFoundException } from '../../domain/exceptions/PatientExceptions';

const PROVINCE_ID = '11111111-1111-4111-8111-111111111111';
const REGENCY_ID = '22222222-2222-4222-8222-222222222222';
const DISTRICT_ID = '33333333-3333-4333-8333-333333333333';
const VILLAGE_ID = '44444444-4444-4444-8444-444444444444';

function buildSut() {
  const patientAddressRepository = new FakePatientAddressRepository();
  const provinceRepository = new FakeProvinceRepository();
  const regencyRepository = new FakeRegencyRepository();
  const districtRepository = new FakeDistrictRepository();
  const villageRepository = new FakeVillageRepository();
  const mapper = new PatientAddressMapper(provinceRepository, regencyRepository, districtRepository, villageRepository);
  const auditService = new FakeAuditService();
  const useCase = new SetPrimaryPatientAddressUseCase(patientAddressRepository, mapper, auditService);
  return { useCase, patientAddressRepository };
}

async function seedTwoAddresses(patientAddressRepository: FakePatientAddressRepository, patientId: string) {
  const first = await patientAddressRepository.create({
    patientId,
    provinceId: PROVINCE_ID,
    regencyId: REGENCY_ID,
    districtId: DISTRICT_ID,
    villageId: VILLAGE_ID,
    addressLine: 'Jl. Pertama',
    isPrimary: true,
  });
  const second = await patientAddressRepository.create({
    patientId,
    provinceId: PROVINCE_ID,
    regencyId: REGENCY_ID,
    districtId: DISTRICT_ID,
    villageId: VILLAGE_ID,
    addressLine: 'Jl. Kedua',
    isPrimary: false,
  });
  return { first, second };
}

describe('SetPrimaryPatientAddressUseCase', () => {
  it('explicitly setting a new primary demotes the previous one', async () => {
    const { useCase, patientAddressRepository } = buildSut();
    const { first, second } = await seedTwoAddresses(patientAddressRepository, 'patient-1');

    const result = await useCase.execute({ patientId: 'patient-1', addressId: second.id, actorUserId: 'staff-1' });

    expect(result.isPrimary).toBe(true);
    const firstRow = await patientAddressRepository.findById(first.id);
    expect(firstRow?.isPrimary).toBe(false);
  });

  it('throws PatientAddressNotFoundException for an address belonging to a different patient', async () => {
    const { useCase, patientAddressRepository } = buildSut();
    const { second } = await seedTwoAddresses(patientAddressRepository, 'patient-1');

    await expect(
      useCase.execute({ patientId: 'other-patient', addressId: second.id, actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(PatientAddressNotFoundException);
  });
});
