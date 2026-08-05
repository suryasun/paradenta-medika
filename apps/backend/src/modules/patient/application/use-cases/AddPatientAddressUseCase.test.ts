import { AddPatientAddressUseCase } from './AddPatientAddressUseCase';
import { PatientAddressRegionValidator } from '../services/PatientAddressRegionValidator';
import { PatientAddressMapper } from '../mappers/PatientAddressMapper';
import { FakePatientAddressRepository, FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import {
  FakeDistrictRepository,
  FakeProvinceRepository,
  FakeRegencyRepository,
  FakeVillageRepository,
} from '../../../../../tests/fakes/masterDataFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
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

  const regionValidator = new PatientAddressRegionValidator(provinceRepository, regencyRepository, districtRepository, villageRepository);
  const mapper = new PatientAddressMapper(provinceRepository, regencyRepository, districtRepository, villageRepository);
  const auditService = new FakeAuditService();

  const useCase = new AddPatientAddressUseCase(patientRepository, patientAddressRepository, regionValidator, mapper, auditService);
  return { useCase, patientRepository, patientAddressRepository, auditService };
}

function validInput(patientId: string, overrides: Partial<Parameters<AddPatientAddressUseCase['execute']>[0]> = {}) {
  return {
    patientId,
    provinceId: PROVINCE_ID,
    regencyId: REGENCY_ID,
    districtId: DISTRICT_ID,
    villageId: VILLAGE_ID,
    addressLine: 'Jl. Gandaria I No. 10',
    actorUserId: 'staff-1',
    ...overrides,
  };
}

async function seedPatient(patientRepository: FakePatientRepository) {
  return patientRepository.create('MRN000001', {
    patientName: 'John Doe',
    gender: 'MALE',
    birthDate: new Date('1998-08-10'),
    phone: '08123456789',
    address: 'Jl. Contoh No. 10',
  });
}

describe('AddPatientAddressUseCase', () => {
  it('forces the first address for a patient to be primary regardless of input', async () => {
    const { useCase, patientRepository } = buildSut();
    const patient = await seedPatient(patientRepository);

    const result = await useCase.execute(validInput(patient.id, { isPrimary: false }));

    expect(result.isPrimary).toBe(true);
  });

  it('adding a second address does not silently unset the first address as primary', async () => {
    const { useCase, patientRepository, patientAddressRepository } = buildSut();
    const patient = await seedPatient(patientRepository);
    const first = await useCase.execute(validInput(patient.id));

    await useCase.execute(validInput(patient.id, { addressLine: 'Jl. Kedua No. 5' }));

    const firstRow = await patientAddressRepository.findById(first.id);
    expect(firstRow?.isPrimary).toBe(true);
  });

  it('explicitly requesting isPrimary:true on a new address demotes the previous primary', async () => {
    const { useCase, patientRepository, patientAddressRepository } = buildSut();
    const patient = await seedPatient(patientRepository);
    const first = await useCase.execute(validInput(patient.id));

    const second = await useCase.execute(validInput(patient.id, { addressLine: 'Jl. Kedua No. 5', isPrimary: true }));

    const firstRow = await patientAddressRepository.findById(first.id);
    expect(firstRow?.isPrimary).toBe(false);
    expect(second.isPrimary).toBe(true);
  });

  it('throws PatientNotFoundException for a non-existent patient', async () => {
    const { useCase } = buildSut();

    await expect(useCase.execute(validInput('missing'))).rejects.toBeInstanceOf(PatientNotFoundException);
  });

  it('rejects a villageId that does not belong to the given districtId', async () => {
    const { useCase, patientRepository } = buildSut();
    const patient = await seedPatient(patientRepository);

    await expect(
      useCase.execute(validInput(patient.id, { districtId: '99999999-9999-4999-8999-999999999999' })),
    ).rejects.toMatchObject({ code: 'PATIENT_ADDRESS_REGION_MISMATCH' });
  });

  it('rejects a nonexistent villageId', async () => {
    const { useCase, patientRepository } = buildSut();
    const patient = await seedPatient(patientRepository);

    await expect(
      useCase.execute(validInput(patient.id, { villageId: '00000000-0000-4000-8000-000000000000' })),
    ).rejects.toMatchObject({ code: 'PATIENT_ADDRESS_REGION_MISMATCH' });
  });
});
