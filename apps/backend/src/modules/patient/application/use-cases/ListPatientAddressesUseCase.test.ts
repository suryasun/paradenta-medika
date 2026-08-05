import { ListPatientAddressesUseCase } from './ListPatientAddressesUseCase';
import { PatientAddressMapper } from '../mappers/PatientAddressMapper';
import { FakePatientAddressRepository, FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import {
  FakeDistrictRepository,
  FakeProvinceRepository,
  FakeRegencyRepository,
  FakeVillageRepository,
} from '../../../../../tests/fakes/masterDataFakes';
import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';

const PROVINCE_ID = '11111111-1111-4111-8111-111111111111';
const REGENCY_ID = '22222222-2222-4222-8222-222222222222';
const DISTRICT_ID = '33333333-3333-4333-8333-333333333333';
const VILLAGE_ID = '44444444-4444-4444-8444-444444444444';

function buildSut() {
  const patientRepository = new FakePatientRepository();
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
  const mapper = new PatientAddressMapper(provinceRepository, regencyRepository, districtRepository, villageRepository);
  const useCase = new ListPatientAddressesUseCase(patientRepository, patientAddressRepository, mapper);
  return { useCase, patientRepository, patientAddressRepository };
}

describe('ListPatientAddressesUseCase', () => {
  it('resolves each address FK to its display name', async () => {
    const { useCase, patientRepository, patientAddressRepository } = buildSut();
    const patient = await patientRepository.create('MRN000001', {
      patientName: 'John Doe',
      gender: 'MALE',
      birthDate: new Date('1998-08-10'),
      phone: '08123456789',
      address: 'Jl. Contoh No. 10',
    });
    await patientAddressRepository.create({
      patientId: patient.id,
      provinceId: PROVINCE_ID,
      regencyId: REGENCY_ID,
      districtId: DISTRICT_ID,
      villageId: VILLAGE_ID,
      addressLine: 'Jl. Gandaria I No. 10',
      isPrimary: true,
    });

    const result = await useCase.execute(patient.id);

    expect(result).toHaveLength(1);
    expect(result[0].province.name).toBe('DKI Jakarta');
    expect(result[0].regency.name).toBe('Jakarta Selatan');
    expect(result[0].district.name).toBe('Kebayoran Baru');
    expect(result[0].village.name).toBe('Gandaria Utara');
    expect(result[0].isPrimary).toBe(true);
  });

  it('returns an empty list for a patient with no addresses', async () => {
    const { useCase, patientRepository } = buildSut();
    const patient = await patientRepository.create('MRN000002', {
      patientName: 'Jane Doe',
      gender: 'FEMALE',
      birthDate: new Date('1995-01-01'),
      phone: '08129876543',
      address: 'Jl. Contoh No. 20',
    });

    const result = await useCase.execute(patient.id);

    expect(result).toEqual([]);
  });

  it('throws PatientNotFoundException for a non-existent patient', async () => {
    const { useCase } = buildSut();

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(PatientNotFoundException);
  });
});
