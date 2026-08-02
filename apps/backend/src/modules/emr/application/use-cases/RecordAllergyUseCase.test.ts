import { RecordAllergyUseCase } from './RecordAllergyUseCase';
import { GetAllergiesUseCase } from './GetAllergiesUseCase';
import { FakeAllergyRepository } from '../../../../../tests/fakes/emrFakes';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';

async function seedPatient(repo: FakePatientRepository) {
  return repo.create('MRN000002', {
    patientName: 'Allergy Test Patient',
    gender: 'FEMALE',
    birthDate: new Date('1985-05-05'),
    phone: '08129876543',
    address: 'Jl. Test No. 2',
  });
}

describe('RecordAllergyUseCase (task-062)', () => {
  it('rejects recording an allergy for a patient that does not exist', async () => {
    const patientRepository = new FakePatientRepository();
    const allergyRepository = new FakeAllergyRepository();
    const auditService = new FakeAuditService();
    const useCase = new RecordAllergyUseCase(patientRepository, allergyRepository, auditService);

    await expect(
      useCase.execute({ patientId: 'missing', type: 'DRUG', allergen: 'Penicillin', severity: 'SEVERE', actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(PatientNotFoundException);
  });

  it('persists severity so a Severe allergy can surface prominently when the Visit opens', async () => {
    const patientRepository = new FakePatientRepository();
    const allergyRepository = new FakeAllergyRepository();
    const auditService = new FakeAuditService();
    const patient = await seedPatient(patientRepository);
    const useCase = new RecordAllergyUseCase(patientRepository, allergyRepository, auditService);
    const getUseCase = new GetAllergiesUseCase(patientRepository, allergyRepository);

    await useCase.execute({ patientId: patient.id, type: 'DRUG', allergen: 'Penicillin', severity: 'SEVERE', actorUserId: 'doc-1' });
    await useCase.execute({ patientId: patient.id, type: 'FOOD', allergen: 'Shellfish', severity: 'MILD', actorUserId: 'doc-1' });

    const allergies = await getUseCase.execute(patient.id);
    expect(allergies).toHaveLength(2);
    expect(allergies.find((a) => a.allergen === 'Penicillin')?.severity).toBe('SEVERE');
  });

  it('records an audit trail entry for every allergy change (Section 19: Seluruh perubahan dicatat pada Audit Trail)', async () => {
    const patientRepository = new FakePatientRepository();
    const allergyRepository = new FakeAllergyRepository();
    const auditService = new FakeAuditService();
    const patient = await seedPatient(patientRepository);
    const useCase = new RecordAllergyUseCase(patientRepository, allergyRepository, auditService);

    await useCase.execute({ patientId: patient.id, type: 'LATEX', allergen: 'Latex gloves', severity: 'MODERATE', actorUserId: 'doc-1' });

    expect(auditService.records).toHaveLength(1);
    expect(auditService.records[0].entity).toBe('Allergy');
    expect(auditService.records[0].action).toBe('CREATE');
  });
});
