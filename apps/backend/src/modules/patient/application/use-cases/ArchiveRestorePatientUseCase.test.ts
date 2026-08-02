import { ArchivePatientUseCase } from './ArchivePatientUseCase';
import { RestorePatientUseCase } from './RestorePatientUseCase';
import { ListPatientsUseCase } from './ListPatientsUseCase';
import { FakePatientRepository, FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';

async function seedPatient(repo: FakePatientRepository) {
  return repo.create('MRN000001', {
    patientName: 'John Doe',
    gender: 'MALE',
    birthDate: new Date('1998-08-10'),
    phone: '08123456789',
    address: 'Jl. Contoh No. 10',
  });
}

describe('Archive / Restore Patient', () => {
  it('archiving excludes the patient from active list results but the record remains retrievable by id', async () => {
    const patientRepository = new FakePatientRepository();
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const patient = await seedPatient(patientRepository);
    const archiveUseCase = new ArchivePatientUseCase(patientRepository, auditService, eventBus);
    const listUseCase = new ListPatientsUseCase(patientRepository);

    await archiveUseCase.execute({ patientId: patient.id, actorUserId: 'staff-1' });

    const { items } = await listUseCase.execute({ page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(items).toHaveLength(0);

    const stillRetrievable = await patientRepository.findById(patient.id);
    expect(stillRetrievable).not.toBeNull();
    expect(stillRetrievable?.active).toBe(false);
  });

  it('restoring returns the patient to active list results', async () => {
    const patientRepository = new FakePatientRepository();
    const auditService = new FakeAuditService();
    const eventBus = new FakeEventBus();
    const patient = await seedPatient(patientRepository);
    const archiveUseCase = new ArchivePatientUseCase(patientRepository, auditService, eventBus);
    const restoreUseCase = new RestorePatientUseCase(patientRepository, auditService, eventBus);
    const listUseCase = new ListPatientsUseCase(patientRepository);

    await archiveUseCase.execute({ patientId: patient.id, actorUserId: 'staff-1' });
    await restoreUseCase.execute({ patientId: patient.id, actorUserId: 'staff-1' });

    const { items } = await listUseCase.execute({ page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(items).toHaveLength(1);
    expect(items[0].status).toBe('ACTIVE');
  });
});
