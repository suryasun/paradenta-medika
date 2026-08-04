import { buildCrudUseCases } from '../shared/crudUseCaseFactory';
import { FakeMasterDataTemplateRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';

describe('task-221: MasterDataTemplate versioning', () => {
  it('bumps version when templatePayload changes, so a branch synced to a prior version can be diffed', async () => {
    const repository = new FakeMasterDataTemplateRepository();
    const auditService = new FakeAuditService();
    const useCases = buildCrudUseCases('MasterDataTemplate', repository, auditService);

    const created = await useCases.create(
      { entityType: 'TREATMENT', templatePayload: { name: 'Scaling', price: 100000 }, ownerClinicId: 'clinic-1' },
      { actorUserId: 'admin-1' },
    );
    expect(created.version).toBe(1);

    const updated = await useCases.update(created.id, { templatePayload: { name: 'Scaling', price: 150000 } }, { actorUserId: 'admin-1' });

    expect(updated.version).toBe(2);
  });

  it('leaves version unchanged when the update has no templatePayload', async () => {
    const repository = new FakeMasterDataTemplateRepository();
    const auditService = new FakeAuditService();
    const useCases = buildCrudUseCases('MasterDataTemplate', repository, auditService);
    const created = await useCases.create(
      { entityType: 'TREATMENT', templatePayload: { name: 'Scaling' }, ownerClinicId: 'clinic-1' },
      { actorUserId: 'admin-1' },
    );

    const updated = await useCases.update(created.id, {}, { actorUserId: 'admin-1' });

    expect(updated.version).toBe(1);
  });
});
