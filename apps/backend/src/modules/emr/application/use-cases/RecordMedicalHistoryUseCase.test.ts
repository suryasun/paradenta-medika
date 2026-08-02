import { RecordMedicalHistoryUseCase } from './RecordMedicalHistoryUseCase';
import { GetMedicalHistoryUseCase } from './GetMedicalHistoryUseCase';
import { FakeMedicalHistoryRepository } from '../../../../../tests/fakes/emrFakes';
import { FakePatientRepository } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { PatientNotFoundException } from '../../../patient/domain/exceptions/PatientExceptions';

async function seedPatient(repo: FakePatientRepository) {
  return repo.create('MRN000001', {
    patientName: 'Test Patient',
    gender: 'MALE',
    birthDate: new Date('1990-01-01'),
    phone: '08123456789',
    address: 'Jl. Test No. 1',
  });
}

describe('RecordMedicalHistoryUseCase (task-061)', () => {
  it('rejects recording history for a patient that does not exist', async () => {
    const patientRepository = new FakePatientRepository();
    const medicalHistoryRepository = new FakeMedicalHistoryRepository();
    const auditService = new FakeAuditService();
    const useCase = new RecordMedicalHistoryUseCase(patientRepository, medicalHistoryRepository, auditService);

    await expect(
      useCase.execute({ patientId: 'missing', category: 'DIABETES', description: 'Type 2', actorUserId: 'doc-1' }),
    ).rejects.toBeInstanceOf(PatientNotFoundException);
  });

  it('preserves the prior version instead of overwriting it when the same category is updated (Section 18: Sistem menyimpan histori perubahan)', async () => {
    const patientRepository = new FakePatientRepository();
    const medicalHistoryRepository = new FakeMedicalHistoryRepository();
    const auditService = new FakeAuditService();
    const patient = await seedPatient(patientRepository);
    const useCase = new RecordMedicalHistoryUseCase(patientRepository, medicalHistoryRepository, auditService);
    const getUseCase = new GetMedicalHistoryUseCase(patientRepository, medicalHistoryRepository);

    const first = await useCase.execute({
      patientId: patient.id,
      category: 'DIABETES',
      description: 'Diagnosed Type 2, controlled with metformin',
      actorUserId: 'doc-1',
    });
    const second = await useCase.execute({
      patientId: patient.id,
      category: 'DIABETES',
      description: 'Progressed to insulin-dependent',
      actorUserId: 'doc-1',
    });

    const fullHistory = await medicalHistoryRepository.findAllByPatientId(patient.id);
    expect(fullHistory).toHaveLength(2);
    const priorEntry = fullHistory.find((e) => e.id === first.id)!;
    expect(priorEntry.isActive).toBe(false);
    expect(priorEntry.description).toBe('Diagnosed Type 2, controlled with metformin');

    const active = await getUseCase.execute(patient.id);
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(second.id);
    expect(active[0].description).toBe('Progressed to insulin-dependent');
  });

  it('records an audit trail entry for every recorded history entry', async () => {
    const patientRepository = new FakePatientRepository();
    const medicalHistoryRepository = new FakeMedicalHistoryRepository();
    const auditService = new FakeAuditService();
    const patient = await seedPatient(patientRepository);
    const useCase = new RecordMedicalHistoryUseCase(patientRepository, medicalHistoryRepository, auditService);

    await useCase.execute({ patientId: patient.id, category: 'HYPERTENSION', description: 'Stage 1', actorUserId: 'doc-1' });

    expect(auditService.records).toHaveLength(1);
    expect(auditService.records[0].entity).toBe('MedicalHistory');
    expect(auditService.records[0].action).toBe('CREATE');
  });
});
