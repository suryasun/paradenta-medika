import { ListEmergencyContactsUseCase } from './ListEmergencyContactsUseCase';
import { FakePatientEmergencyContactRepository, FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';

function buildSut() {
  const patientRepository = new FakePatientRepository();
  const contactRepository = new FakePatientEmergencyContactRepository();
  const useCase = new ListEmergencyContactsUseCase(patientRepository, contactRepository);
  return { patientRepository, contactRepository, useCase };
}

describe('ListEmergencyContactsUseCase', () => {
  it('returns an empty list for a patient with no emergency contacts', async () => {
    const { patientRepository, useCase } = buildSut();
    const patient = await patientRepository.create('MRN000001', {
      patientName: 'John Doe',
      gender: 'MALE',
      birthDate: new Date('1998-08-10'),
      phone: '08123456789',
      address: 'Jl. Contoh No. 10',
    });

    const result = await useCase.execute(patient.id);

    expect(result).toEqual([]);
  });

  it('throws PatientNotFoundException for a non-existent patient', async () => {
    const { useCase } = buildSut();

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(PatientNotFoundException);
  });
});
