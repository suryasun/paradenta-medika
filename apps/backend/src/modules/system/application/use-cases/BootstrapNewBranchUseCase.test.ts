import { BootstrapNewBranchUseCase } from './BootstrapNewBranchUseCase';
import { FakeWarehouseLocationRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAccountRepository } from '../../../../../tests/fakes/financeFakes';
import { FakeSystemParameterRepository } from '../../../../../tests/fakes/systemFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { BRANCH_CREATED_EVENT, BranchCreatedPayload } from '../../../master-data/domain/events/MasterDataEvents';

function buildPayload(branchId = 'branch-1'): BranchCreatedPayload {
  return { event: BRANCH_CREATED_EVENT, branchId, clinicId: 'clinic-1', branchCode: 'BR-A', occurredAt: new Date().toISOString() };
}

function buildDeps() {
  const warehouseLocationRepository = new FakeWarehouseLocationRepository();
  const accountRepository = new FakeAccountRepository();
  const systemParameterRepository = new FakeSystemParameterRepository();
  const auditService = new FakeAuditService();
  const useCase = new BootstrapNewBranchUseCase(warehouseLocationRepository, accountRepository, systemParameterRepository, auditService);
  return { useCase, warehouseLocationRepository, accountRepository, systemParameterRepository, auditService };
}

describe('task-224: BootstrapNewBranchUseCase', () => {
  it('provisions a default Warehouse Location for the new branch', async () => {
    const { useCase, warehouseLocationRepository } = buildDeps();

    await useCase.execute(buildPayload());

    const location = await warehouseLocationRepository.findByBranchAndCode('branch-1', 'MAIN');
    expect(location).not.toBeNull();
    expect(location?.branchId).toBe('branch-1');
  });

  it('mirrors the clinic template Chart of Accounts, preserving parent/child hierarchy', async () => {
    const { useCase, accountRepository } = buildDeps();
    const parentTemplate = await accountRepository.create({
      branchId: null,
      code: '1000',
      name: 'Assets',
      accountType: 'ASSET',
      normalBalance: 'DEBIT',
      isPostable: false,
      createdBy: 'admin-1',
    });
    await accountRepository.create({
      branchId: null,
      code: '1100',
      name: 'Cash',
      accountType: 'ASSET',
      normalBalance: 'DEBIT',
      parentId: parentTemplate.id,
      isPostable: true,
      createdBy: 'admin-1',
    });

    await useCase.execute(buildPayload());

    const branchParent = await accountRepository.findByBranchAndCode('branch-1', '1000');
    const branchChild = await accountRepository.findByBranchAndCode('branch-1', '1100');
    expect(branchParent).not.toBeNull();
    expect(branchChild).not.toBeNull();
    expect(branchChild?.parentId).toBe(branchParent?.id);
  });

  it('inherits GLOBAL-scope System Parameters as BRANCH-scope defaults', async () => {
    const { useCase, systemParameterRepository } = buildDeps();
    await systemParameterRepository.create({
      key: 'reservation.slot.duration',
      scopeType: 'GLOBAL',
      valueType: 'INTEGER',
      value: '30',
      createdBy: 'admin-1',
    });

    await useCase.execute(buildPayload());

    const branchParam = await systemParameterRepository.findLatest('reservation.slot.duration', 'BRANCH', 'branch-1');
    expect(branchParam?.value).toBe('30');
  });

  it('does not override an existing BRANCH-scope parameter with the GLOBAL default', async () => {
    const { useCase, systemParameterRepository } = buildDeps();
    await systemParameterRepository.create({
      key: 'reservation.slot.duration',
      scopeType: 'GLOBAL',
      valueType: 'INTEGER',
      value: '30',
      createdBy: 'admin-1',
    });
    await systemParameterRepository.create({
      key: 'reservation.slot.duration',
      scopeType: 'BRANCH',
      scopeId: 'branch-1',
      valueType: 'INTEGER',
      value: '45',
      createdBy: 'admin-1',
    });

    await useCase.execute(buildPayload());

    const branchParam = await systemParameterRepository.findLatest('reservation.slot.duration', 'BRANCH', 'branch-1');
    expect(branchParam?.value).toBe('45');
  });

  it('redelivering the bootstrap event for an already-bootstrapped branch does not create duplicates', async () => {
    const { useCase, warehouseLocationRepository, accountRepository, systemParameterRepository } = buildDeps();
    await accountRepository.create({
      branchId: null,
      code: '1000',
      name: 'Assets',
      accountType: 'ASSET',
      normalBalance: 'DEBIT',
      isPostable: true,
      createdBy: 'admin-1',
    });
    await systemParameterRepository.create({
      key: 'reservation.slot.duration',
      scopeType: 'GLOBAL',
      valueType: 'INTEGER',
      value: '30',
      createdBy: 'admin-1',
    });

    await useCase.execute(buildPayload());
    await useCase.execute(buildPayload());

    expect([...warehouseLocationRepository.locations.values()].filter((l) => l.branchId === 'branch-1')).toHaveLength(1);
    expect([...accountRepository.accounts.values()].filter((a) => a.branchId === 'branch-1')).toHaveLength(1);
    expect(
      [...systemParameterRepository.parameters.values()].filter((p) => p.scopeType === 'BRANCH' && p.scopeId === 'branch-1'),
    ).toHaveLength(1);
  });
});
