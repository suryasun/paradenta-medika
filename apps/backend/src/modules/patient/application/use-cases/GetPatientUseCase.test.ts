import { GetPatientUseCase } from './GetPatientUseCase';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { PatientNotFoundException } from '../../domain/exceptions/PatientExceptions';

describe('GetPatientUseCase', () => {
  it('returns the full profile with empty history collections when none exist', async () => {
    const patientRepository = new FakePatientRepository();
    const created = await patientRepository.create('MRN000001', {
      patientName: 'John Doe',
      gender: 'MALE',
      birthDate: new Date('1998-08-10'),
      phone: '08123456789',
      address: 'Jl. Contoh No. 10',
    });
    const useCase = new GetPatientUseCase(patientRepository);

    const detail = await useCase.execute(created.id);

    expect(detail.medicalRecordNumber).toBe('MRN000001');
    expect(detail.visitHistory).toEqual([]);
    expect(detail.reservationHistory).toEqual([]);
    expect(detail.paymentHistory).toEqual([]);
    expect(detail.emergencyContacts).toEqual([]);
  });

  it('throws PatientNotFoundException for a non-existent id (404)', async () => {
    const patientRepository = new FakePatientRepository();
    const useCase = new GetPatientUseCase(patientRepository);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(PatientNotFoundException);
  });
});
