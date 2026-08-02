import { CreateWarehouseLocationUseCase } from './CreateWarehouseLocationUseCase';
import { FakeWarehouseLocationRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { WarehouseLocationCodeExistsException } from '../../domain/exceptions/WarehouseExceptions';

function buildSut() {
  const warehouseLocationRepository = new FakeWarehouseLocationRepository();
  const auditService = new FakeAuditService();
  const useCase = new CreateWarehouseLocationUseCase(warehouseLocationRepository, auditService);
  return { useCase };
}

describe('CreateWarehouseLocationUseCase (task-101)', () => {
  it('creates a warehouse location', async () => {
    const { useCase } = buildSut();
    const location = await useCase.execute({ branchId: 'branch-1', code: 'WH-01', name: 'Main Warehouse', actorUserId: 'u1' });
    expect(location.code).toBe('WH-01');
  });

  it('rejects a duplicate code within the same branch', async () => {
    const { useCase } = buildSut();
    await useCase.execute({ branchId: 'branch-1', code: 'WH-02', name: 'Warehouse A', actorUserId: 'u1' });
    await expect(
      useCase.execute({ branchId: 'branch-1', code: 'WH-02', name: 'Warehouse B', actorUserId: 'u1' }),
    ).rejects.toBeInstanceOf(WarehouseLocationCodeExistsException);
  });

  it('allows the same code in a different branch', async () => {
    const { useCase } = buildSut();
    await useCase.execute({ branchId: 'branch-1', code: 'WH-03', name: 'Warehouse A', actorUserId: 'u1' });
    const other = await useCase.execute({ branchId: 'branch-2', code: 'WH-03', name: 'Warehouse B', actorUserId: 'u1' });
    expect(other.code).toBe('WH-03');
  });
});
