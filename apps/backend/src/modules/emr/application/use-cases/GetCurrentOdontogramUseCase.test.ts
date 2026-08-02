import { GetCurrentOdontogramUseCase } from './GetCurrentOdontogramUseCase';
import { FakeOdontogramRepository } from '../../../../../tests/fakes/emrFakes';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';

async function seedPatient(repo: FakePatientRepository) {
  return repo.create('MRN000003', {
    patientName: 'Odontogram Test Patient',
    gender: 'MALE',
    birthDate: new Date('1992-02-02'),
    phone: '08120001111',
    address: 'Jl. Test No. 3',
  });
}

describe('GetCurrentOdontogramUseCase (task-069)', () => {
  it('returns only the latest entry per (tooth, surface), ignoring superseded versions', async () => {
    const patientRepository = new FakePatientRepository();
    const odontogramRepository = new FakeOdontogramRepository();
    const patient = await seedPatient(patientRepository);

    await odontogramRepository.create({ visitId: 'v1', patientId: patient.id, toothNumber: 16, surface: 'O', toothConditionId: 'healthy', createdBy: 'doc-1' });
    await odontogramRepository.create({ visitId: 'v2', patientId: patient.id, toothNumber: 16, surface: 'O', toothConditionId: 'caries', createdBy: 'doc-1' });
    await odontogramRepository.create({ visitId: 'v2', patientId: patient.id, toothNumber: 21, surface: undefined, toothConditionId: 'crown', createdBy: 'doc-1' });

    const useCase = new GetCurrentOdontogramUseCase(patientRepository, odontogramRepository);
    const current = await useCase.execute(patient.id);

    expect(current).toHaveLength(2);
    const tooth16 = current.find((e) => e.toothNumber === 16)!;
    expect(tooth16.toothConditionId).toBe('caries');
    const tooth21 = current.find((e) => e.toothNumber === 21)!;
    expect(tooth21.toothConditionId).toBe('crown');
    expect(tooth21.surface).toBeNull();
  });

  it('returns an empty odontogram for a patient with no recorded entries', async () => {
    const patientRepository = new FakePatientRepository();
    const odontogramRepository = new FakeOdontogramRepository();
    const patient = await seedPatient(patientRepository);
    const useCase = new GetCurrentOdontogramUseCase(patientRepository, odontogramRepository);

    expect(await useCase.execute(patient.id)).toEqual([]);
  });
});
