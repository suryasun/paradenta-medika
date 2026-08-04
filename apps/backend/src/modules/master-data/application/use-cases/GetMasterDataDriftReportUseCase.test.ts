import { GetMasterDataDriftReportUseCase } from './GetMasterDataDriftReportUseCase';
import { PushMasterDataTemplateUseCase } from './PushMasterDataTemplateUseCase';
import { FakeMasterDataTemplateRepository, FakeMasterDataTemplateBranchLinkRepository, FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { MasterDataNotFoundException } from '../../domain/exceptions/MasterDataExceptions';

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
});
