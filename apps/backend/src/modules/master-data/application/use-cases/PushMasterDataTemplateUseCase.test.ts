import { PushMasterDataTemplateUseCase } from './PushMasterDataTemplateUseCase';
import { FakeMasterDataTemplateRepository, FakeMasterDataTemplateBranchLinkRepository, FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { MasterDataNotFoundException, MasterDataReferenceInvalidException } from '../../domain/exceptions/MasterDataExceptions';

async function buildTemplate(templateRepository: FakeMasterDataTemplateRepository, payload: Record<string, unknown> = { name: 'Scaling', price: 100000 }) {
  return templateRepository.create({ entityType: 'TREATMENT', templatePayload: payload, ownerClinicId: 'clinic-1' });
}

describe('task-222: PushMasterDataTemplateUseCase', () => {
  it('creates a new branch link when none exists yet', async () => {
    const templateRepository = new FakeMasterDataTemplateRepository();
    const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
    const branchRepository = new FakeBranchRepository();
    const auditService = new FakeAuditService();
    const template = await buildTemplate(templateRepository);
    const branch = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const useCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService);

    const results = await useCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });

    expect(results).toEqual([{ branchId: branch.id, status: 'CREATED' }]);
    expect(auditService.records).toHaveLength(1);
  });

  it('updates an un-diverged branch link on re-push', async () => {
    const templateRepository = new FakeMasterDataTemplateRepository();
    const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
    const branchRepository = new FakeBranchRepository();
    const auditService = new FakeAuditService();
    const template = await buildTemplate(templateRepository);
    const branch = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const useCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService);
    await useCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });
    await templateRepository.update(template.id, { templatePayload: { name: 'Scaling', price: 150000 } });

    const results = await useCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });

    expect(results).toEqual([{ branchId: branch.id, status: 'UPDATED' }]);
    const link = await branchLinkRepository.findByTemplateAndBranch(template.id, branch.id);
    expect(link?.snapshotPayload).toEqual({ name: 'Scaling', price: 150000 });
    expect(link?.pushedVersion).toBe(2);
  });

  it('flags a locally-diverged branch as CONFLICT instead of silently overwriting it', async () => {
    const templateRepository = new FakeMasterDataTemplateRepository();
    const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
    const branchRepository = new FakeBranchRepository();
    const auditService = new FakeAuditService();
    const template = await buildTemplate(templateRepository);
    const branch = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const useCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService);
    await useCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });
    const link = await branchLinkRepository.findByTemplateAndBranch(template.id, branch.id);
    branchLinkRepository.simulateLocalEdit(link!.id, { name: 'Scaling (Branch A custom)', price: 120000 });

    const results = await useCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });

    expect(results).toEqual([{ branchId: branch.id, status: 'CONFLICT' }]);
    const unchangedLink = await branchLinkRepository.findByTemplateAndBranch(template.id, branch.id);
    expect(unchangedLink?.currentPayload).toEqual({ name: 'Scaling (Branch A custom)', price: 120000 });
  });

  it('does not let one conflicting branch block the push to other requested branches', async () => {
    const templateRepository = new FakeMasterDataTemplateRepository();
    const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
    const branchRepository = new FakeBranchRepository();
    const auditService = new FakeAuditService();
    const template = await buildTemplate(templateRepository);
    const branchA = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
    const branchB = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-B', branchName: 'Branch B', phone: '021', email: 'b@x.com', address: 'Jl. B' });
    const useCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService);
    await useCase.execute({ templateId: template.id, branchIds: [branchA.id], actorUserId: 'admin-1' });
    const linkA = await branchLinkRepository.findByTemplateAndBranch(template.id, branchA.id);
    branchLinkRepository.simulateLocalEdit(linkA!.id, { name: 'Custom' });

    const results = await useCase.execute({ templateId: template.id, branchIds: [branchA.id, branchB.id], actorUserId: 'admin-1' });

    expect(results).toEqual([
      { branchId: branchA.id, status: 'CONFLICT' },
      { branchId: branchB.id, status: 'CREATED' },
    ]);
  });

  it('rejects an unknown template', async () => {
    const templateRepository = new FakeMasterDataTemplateRepository();
    const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
    const branchRepository = new FakeBranchRepository();
    const auditService = new FakeAuditService();
    const useCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService);

    await expect(useCase.execute({ templateId: 'missing', branchIds: ['branch-a'], actorUserId: 'admin-1' })).rejects.toThrow(
      MasterDataNotFoundException,
    );
  });

  it('rejects an unknown branchId', async () => {
    const templateRepository = new FakeMasterDataTemplateRepository();
    const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
    const branchRepository = new FakeBranchRepository();
    const auditService = new FakeAuditService();
    const template = await buildTemplate(templateRepository);
    const useCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService);

    await expect(useCase.execute({ templateId: template.id, branchIds: ['missing-branch'], actorUserId: 'admin-1' })).rejects.toThrow(
      MasterDataReferenceInvalidException,
    );
  });
});
