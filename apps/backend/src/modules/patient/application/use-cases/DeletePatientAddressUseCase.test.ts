import { DeletePatientAddressUseCase } from './DeletePatientAddressUseCase';
import { FakePatientAddressRepository } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PatientAddressNotFoundException, PatientAddressPrimaryRequiredException } from '../../domain/exceptions/PatientExceptions';

const PROVINCE_ID = '11111111-1111-4111-8111-111111111111';
const REGENCY_ID = '22222222-2222-4222-8222-222222222222';
const DISTRICT_ID = '33333333-3333-4333-8333-333333333333';
const VILLAGE_ID = '44444444-4444-4444-8444-444444444444';

function buildSut() {
  const patientAddressRepository = new FakePatientAddressRepository();
  const auditService = new FakeAuditService();
  const useCase = new DeletePatientAddressUseCase(patientAddressRepository, auditService);
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

describe('DeletePatientAddressUseCase', () => {
  it('deletes a non-primary address without requiring a replacement', async () => {
    const { useCase, patientAddressRepository } = buildSut();
    const primary = await patientAddressRepository.create(addressProps('p1', { isPrimary: true }));
    const secondary = await patientAddressRepository.create(addressProps('p1', { addressLine: 'Jl. Kedua' }));

    await useCase.execute({ patientId: 'p1', addressId: secondary.id, actorUserId: 'staff-1' });

    expect(await patientAddressRepository.findById(secondary.id)).toBeNull();
    expect((await patientAddressRepository.findById(primary.id))?.isPrimary).toBe(true);
  });

  it('deletes the sole address (leaving the patient with zero) without requiring a replacement', async () => {
    const { useCase, patientAddressRepository } = buildSut();
    const sole = await patientAddressRepository.create(addressProps('p1', { isPrimary: true }));

    await useCase.execute({ patientId: 'p1', addressId: sole.id, actorUserId: 'staff-1' });

    expect(await patientAddressRepository.findById(sole.id)).toBeNull();
  });

  it('rejects deleting the primary address when other addresses exist and no replacement is designated', async () => {
    const { useCase, patientAddressRepository } = buildSut();
    const primary = await patientAddressRepository.create(addressProps('p1', { isPrimary: true }));
    await patientAddressRepository.create(addressProps('p1', { addressLine: 'Jl. Kedua' }));

    await expect(useCase.execute({ patientId: 'p1', addressId: primary.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      PatientAddressPrimaryRequiredException,
    );
  });

  it('deleting the primary address with a designated replacement promotes the replacement first', async () => {
    const { useCase, patientAddressRepository } = buildSut();
    const primary = await patientAddressRepository.create(addressProps('p1', { isPrimary: true }));
    const replacement = await patientAddressRepository.create(addressProps('p1', { addressLine: 'Jl. Kedua' }));

    await useCase.execute({ patientId: 'p1', addressId: primary.id, newPrimaryAddressId: replacement.id, actorUserId: 'staff-1' });

    expect(await patientAddressRepository.findById(primary.id)).toBeNull();
    expect((await patientAddressRepository.findById(replacement.id))?.isPrimary).toBe(true);
  });

  it('throws PatientAddressNotFoundException when the address belongs to a different patient', async () => {
    const { useCase, patientAddressRepository } = buildSut();
    const address = await patientAddressRepository.create(addressProps('p1', { isPrimary: true }));

    await expect(
      useCase.execute({ patientId: 'other-patient', addressId: address.id, actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(PatientAddressNotFoundException);
  });
});
