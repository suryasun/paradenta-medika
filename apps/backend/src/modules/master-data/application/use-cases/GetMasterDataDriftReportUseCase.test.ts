import { GetMasterDataDriftReportUseCase } from './GetMasterDataDriftReportUseCase';
import { PushMasterDataTemplateUseCase } from './PushMasterDataTemplateUseCase';
import { FakeMasterDataTemplateRepository, FakeMasterDataTemplateBranchLinkRepository, FakeBranchRepository, FakeToothConditionRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeTreatmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakePaymentMethodRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { MasterDataNotFoundException } from '../../domain/exceptions/MasterDataExceptions';
import { buildMasterDataTemplateEntityAdapterRegistry } from '../services/masterDataTemplateEntityAdapters';

describe('task-223: GetMasterDataDriftReportUseCase', () => {
  it('lists field-by-field divergence for a locally-modified branch, not just a boolean', async () => {
    const templateRepository = new FakeMasterDataTemplateRepository();
    const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
    const branchRepository = new FakeBranchRepository();
    const auditService = new FakeAuditService();
    const template = await templateRepository.create({ entityType: 'TREATMENT', templatePayload: { name: 'Scaling', price: 100000 }, ownerClinicId: 'clinic-1' });
    const branch = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const pushUseCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService);
    await pushUseCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });
    const link = await branchLinkRepository.findByTemplateAndBranch(template.id, branch.id);
    branchLinkRepository.simulateLocalEdit(link!.id, { name: 'Scaling (custom)', price: 100000 });

    const useCase = new GetMasterDataDriftReportUseCase(templateRepository, branchLinkRepository);
    const report = await useCase.execute(template.id);

    expect(report).toEqual([
      {
        branchId: branch.id,
        pushedVersion: 1,
        isStale: false,
        fieldDrifts: [{ field: 'name', pushedValue: 'Scaling', currentValue: 'Scaling (custom)' }],
      },
    ]);
  });

  it('flags a branch as stale when the template has evolved since its last push', async () => {
    const templateRepository = new FakeMasterDataTemplateRepository();
    const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
    const branchRepository = new FakeBranchRepository();
    const auditService = new FakeAuditService();
    const template = await templateRepository.create({ entityType: 'TREATMENT', templatePayload: { name: 'Scaling' }, ownerClinicId: 'clinic-1' });
    const branch = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const pushUseCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService);
    await pushUseCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });
    await templateRepository.update(template.id, { templatePayload: { name: 'Scaling v2' } });

    const useCase = new GetMasterDataDriftReportUseCase(templateRepository, branchLinkRepository);
    const report = await useCase.execute(template.id);

    expect(report).toEqual([{ branchId: branch.id, pushedVersion: 1, isStale: true, fieldDrifts: [] }]);
  });

  it('reports no drift for an in-sync branch', async () => {
    const templateRepository = new FakeMasterDataTemplateRepository();
    const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
    const branchRepository = new FakeBranchRepository();
    const auditService = new FakeAuditService();
    const template = await templateRepository.create({ entityType: 'TREATMENT', templatePayload: { name: 'Scaling' }, ownerClinicId: 'clinic-1' });
    const branch = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const pushUseCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService);
    await pushUseCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });

    const useCase = new GetMasterDataDriftReportUseCase(templateRepository, branchLinkRepository);
    const report = await useCase.execute(template.id);

    expect(report).toEqual([{ branchId: branch.id, pushedVersion: 1, isStale: false, fieldDrifts: [] }]);
  });

  it('rejects an unknown template', async () => {
    const templateRepository = new FakeMasterDataTemplateRepository();
    const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
    const useCase = new GetMasterDataDriftReportUseCase(templateRepository, branchLinkRepository);

    await expect(useCase.execute('missing')).rejects.toThrow(MasterDataNotFoundException);
  });

  // Phase 4 hardening: for an entityType registered in the adapter
  // registry, drift must reflect a manual edit made through the entity's
  // own CRUD endpoint (not just an edit to the JSON snapshot itself, which
  // is all the pre-existing tests above exercise).
  it('refreshes currentPayload from the live Treatment row before diffing, so a direct entity edit shows up as drift', async () => {
    const templateRepository = new FakeMasterDataTemplateRepository();
    const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
    const branchRepository = new FakeBranchRepository();
    const auditService = new FakeAuditService();
    const treatmentRepository = new FakeTreatmentRepository();
    const entityAdapters = buildMasterDataTemplateEntityAdapterRegistry(treatmentRepository, new FakePaymentMethodRepository(), new FakeToothConditionRepository());
    const template = await templateRepository.create({
      entityType: 'TREATMENT',
      templatePayload: { treatmentCode: 'TRT-X', treatmentName: 'Scaling', treatmentCategoryId: 'cat-1', defaultPrice: 100000 },
      ownerClinicId: 'clinic-1',
    });
    const branch = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const pushUseCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService, entityAdapters);
    const [pushResult] = await pushUseCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });

    // Simulate an Administrator directly editing the branch-scoped Treatment
    // via its own PATCH /masterdata/treatments/{id} endpoint -- not via the template.
    await treatmentRepository.update(pushResult.appliedEntityId!, { treatmentName: 'Scaling (edited via Treatment CRUD)' });

    const useCase = new GetMasterDataDriftReportUseCase(templateRepository, branchLinkRepository, entityAdapters);
    const report = await useCase.execute(template.id);

    expect(report[0].fieldDrifts).toEqual(
      expect.arrayContaining([{ field: 'treatmentName', pushedValue: 'Scaling', currentValue: 'Scaling (edited via Treatment CRUD)' }]),
    );
    const refreshedLink = await branchLinkRepository.findByTemplateAndBranch(template.id, branch.id);
    expect((refreshedLink?.currentPayload as Record<string, unknown>).treatmentName).toBe('Scaling (edited via Treatment CRUD)');
  });
});
