import { GetToothHistoryUseCase } from './GetToothHistoryUseCase';
import { FakeOdontogramRepository } from '../../../../../tests/fakes/emrFakes';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { InvalidToothNumberException } from '../../domain/exceptions/EmrExceptions';

async function seedPatient(repo: FakePatientRepository) {
  return repo.create('MRN000004', {
    patientName: 'History Test Patient',
    gender: 'FEMALE',
    birthDate: new Date('1988-08-08'),
    phone: '08120002222',
    address: 'Jl. Test No. 4',
  });
}

describe('GetToothHistoryUseCase (task-070)', () => {
  it('rejects an invalid FDI tooth number', async () => {
    const patientRepository = new FakePatientRepository();
    const odontogramRepository = new FakeOdontogramRepository();
    const patient = await seedPatient(patientRepository);
    const useCase = new GetToothHistoryUseCase(patientRepository, odontogramRepository);

    await expect(useCase.execute(patient.id, 99)).rejects.toBeInstanceOf(InvalidToothNumberException);
  });

  it('returns every version for a tooth in chronological order, not just the latest', async () => {
    const patientRepository = new FakePatientRepository();
    const odontogramRepository = new FakeOdontogramRepository();
    const patient = await seedPatient(patientRepository);

    const first = await odontogramRepository.create({ visitId: 'v1', patientId: patient.id, toothNumber: 16, surface: 'O', toothConditionId: 'healthy', createdBy: 'doc-1' });
    const second = await odontogramRepository.create({ visitId: 'v2', patientId: patient.id, toothNumber: 16, surface: 'O', toothConditionId: 'caries', createdBy: 'doc-1' });
    const third = await odontogramRepository.create({ visitId: 'v3', patientId: patient.id, toothNumber: 16, surface: 'O', toothConditionId: 'filling', createdBy: 'doc-1' });
    await odontogramRepository.create({ visitId: 'v3', patientId: patient.id, toothNumber: 21, surface: undefined, toothConditionId: 'crown', createdBy: 'doc-1' });

    const useCase = new GetToothHistoryUseCase(patientRepository, odontogramRepository);
    const history = await useCase.execute(patient.id, 16);

    expect(history.map((e) => e.id)).toEqual([first.id, second.id, third.id]);
  });
});
