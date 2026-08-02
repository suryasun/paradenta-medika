import { CreateSupplierUseCase } from './CreateSupplierUseCase';
import { FakeSupplierRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { SupplierCodeExistsException } from '../../domain/exceptions/WarehouseExceptions';

function buildSut() {
  const supplierRepository = new FakeSupplierRepository();
  const auditService = new FakeAuditService();
  const useCase = new CreateSupplierUseCase(supplierRepository, auditService);
  return { useCase };
}

describe('CreateSupplierUseCase (task-099)', () => {
  it('creates a supplier', async () => {
    const { useCase } = buildSut();
    const supplier = await useCase.execute({ code: 'SUP-100', name: 'PT Vendor Alpha', actorUserId: 'u1' });
    expect(supplier.code).toBe('SUP-100');
    expect(supplier.isActive).toBe(true);
  });

  it('rejects a duplicate supplier code', async () => {
    const { useCase } = buildSut();
    await useCase.execute({ code: 'SUP-101', name: 'PT Vendor Beta', actorUserId: 'u1' });
    await expect(useCase.execute({ code: 'SUP-101', name: 'PT Vendor Gamma', actorUserId: 'u1' })).rejects.toBeInstanceOf(
      SupplierCodeExistsException,
    );
  });
});
