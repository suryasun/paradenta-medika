import { PushMasterDataTemplateUseCase } from './PushMasterDataTemplateUseCase';
import { FakeMasterDataTemplateRepository, FakeMasterDataTemplateBranchLinkRepository, FakeBranchRepository, FakeToothConditionRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeTreatmentRepository } from '../../../../../tests/fakes/emrFakes';
import { FakePaymentMethodRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { MasterDataNotFoundException, MasterDataReferenceInvalidException } from '../../domain/exceptions/MasterDataExceptions';
import { buildMasterDataTemplateEntityAdapterRegistry } from '../services/masterDataTemplateEntityAdapters';

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

    expect(results).toEqual([{ branchId: branch.id, status: 'CREATED', appliedToEntity: false }]);
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

    expect(results).toEqual([{ branchId: branch.id, status: 'UPDATED', appliedToEntity: false }]);
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

    expect(results).toEqual([{ branchId: branch.id, status: 'CONFLICT', appliedToEntity: false }]);
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
      { branchId: branchA.id, status: 'CONFLICT', appliedToEntity: false },
      { branchId: branchB.id, status: 'CREATED', appliedToEntity: false },
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

  // Phase 4 hardening: entityType-registered templates now write to the
  // real entity, not just the JSON snapshot -- see TreatmentTemplateAdapter.
  describe('real-entity wiring (entityType registered in the adapter registry)', () => {
    function buildRegistryFixtures() {
      const treatmentRepository = new FakeTreatmentRepository();
      const paymentMethodRepository = new FakePaymentMethodRepository();
      const toothConditionRepository = new FakeToothConditionRepository();
      const entityAdapters = buildMasterDataTemplateEntityAdapterRegistry(treatmentRepository, paymentMethodRepository, toothConditionRepository);
      return { treatmentRepository, paymentMethodRepository, toothConditionRepository, entityAdapters };
    }

    it('a TREATMENT push creates a real branch-scoped Treatment row and records appliedEntityId', async () => {
      const templateRepository = new FakeMasterDataTemplateRepository();
      const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
      const branchRepository = new FakeBranchRepository();
      const auditService = new FakeAuditService();
      const { treatmentRepository, entityAdapters } = buildRegistryFixtures();
      const template = await buildTemplate(templateRepository, {
        treatmentCode: 'TRT-TEMPLATE-01',
        treatmentName: 'Scaling Standar',
        treatmentCategoryId: 'cat-1',
        durationMinute: 30,
        defaultPrice: 200000,
        doctorFee: 60000,
      });
      const branch = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
      const useCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService, entityAdapters);

      const results = await useCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });

      expect(results[0].status).toBe('CREATED');
      expect(results[0].appliedToEntity).toBe(true);
      expect(results[0].appliedEntityId).toBeDefined();
      const created = await treatmentRepository.findByCodeForBranch('TRT-TEMPLATE-01', branch.id);
      expect(created?.branchId).toBe(branch.id);
      expect(created?.treatmentName).toBe('Scaling Standar');
      const link = await branchLinkRepository.findByTemplateAndBranch(template.id, branch.id);
      expect(link?.appliedEntityId).toBe(created?.id);
    });

    it('a re-push updates the existing branch-scoped Treatment row rather than creating a duplicate', async () => {
      const templateRepository = new FakeMasterDataTemplateRepository();
      const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
      const branchRepository = new FakeBranchRepository();
      const auditService = new FakeAuditService();
      const { treatmentRepository, entityAdapters } = buildRegistryFixtures();
      const template = await buildTemplate(templateRepository, {
        treatmentCode: 'TRT-TEMPLATE-01',
        treatmentName: 'Scaling Standar',
        treatmentCategoryId: 'cat-1',
        defaultPrice: 200000,
      });
      const branch = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
      const useCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService, entityAdapters);
      await useCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });
      await templateRepository.update(template.id, {
        templatePayload: { treatmentCode: 'TRT-TEMPLATE-01', treatmentName: 'Scaling Premium', treatmentCategoryId: 'cat-1', defaultPrice: 250000 },
      });

      const results = await useCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });

      expect(results[0].status).toBe('UPDATED');
      expect(results[0].appliedToEntity).toBe(true);
      const rows = [...treatmentRepository.treatments.values()].filter((t) => t.treatmentCode === 'TRT-TEMPLATE-01' && t.branchId === branch.id);
      expect(rows).toHaveLength(1);
      expect(rows[0].treatmentName).toBe('Scaling Premium');
    });

    it('an unregistered entityType keeps the pre-existing JSON-only behavior (appliedToEntity: false)', async () => {
      const templateRepository = new FakeMasterDataTemplateRepository();
      const branchLinkRepository = new FakeMasterDataTemplateBranchLinkRepository();
      const branchRepository = new FakeBranchRepository();
      const auditService = new FakeAuditService();
      const { entityAdapters } = buildRegistryFixtures();
      const template = await templateRepository.create({ entityType: 'ROOM_TYPE', templatePayload: { name: 'VIP' }, ownerClinicId: 'clinic-1' });
      const branch = await branchRepository.create({ clinicId: 'clinic-1', branchCode: 'BR-A', branchName: 'Branch A', phone: '021', email: 'a@x.com', address: 'Jl. A' });
      const useCase = new PushMasterDataTemplateUseCase(templateRepository, branchLinkRepository, branchRepository, auditService, entityAdapters);

      const results = await useCase.execute({ templateId: template.id, branchIds: [branch.id], actorUserId: 'admin-1' });

      expect(results[0]).toEqual({ branchId: branch.id, status: 'CREATED', appliedToEntity: false, appliedEntityId: undefined });
    });
  });
});
