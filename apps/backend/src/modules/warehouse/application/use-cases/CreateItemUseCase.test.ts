import { CreateItemUseCase } from './CreateItemUseCase';
import { FakeItemRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { ItemCodeExistsException } from '../../domain/exceptions/WarehouseExceptions';

function buildSut() {
  const itemRepository = new FakeItemRepository();
  const auditService = new FakeAuditService();
  const useCase = new CreateItemUseCase(itemRepository, auditService);
  return { itemRepository, useCase };
}

describe('CreateItemUseCase (task-096)', () => {
  it('creates an item with the documented Create Item payload shape', async () => {
    const { useCase } = buildSut();

    const item = await useCase.execute({
      code: 'MAT-COMP-002',
      name: 'Dental Composite Resin B2',
      categoryId: 'cat-1',
      unitId: 'unit-1',
      minimumStock: 10,
      isConsumable: true,
      isBatchTracked: true,
      isExpiryTracked: true,
      actorUserId: 'u1',
    });

    expect(item.code).toBe('MAT-COMP-002');
    expect(item.isActive).toBe(true);
  });

  it('rejects a duplicate item code', async () => {
    const { useCase } = buildSut();
    await useCase.execute({
      code: 'MAT-COMP-003',
      name: 'Item A',
      categoryId: 'cat-1',
      unitId: 'unit-1',
      minimumStock: 5,
      isConsumable: true,
      isBatchTracked: false,
      isExpiryTracked: false,
      actorUserId: 'u1',
    });

    await expect(
      useCase.execute({
        code: 'MAT-COMP-003',
        name: 'Item B',
        categoryId: 'cat-1',
        unitId: 'unit-1',
        minimumStock: 5,
        isConsumable: true,
        isBatchTracked: false,
        isExpiryTracked: false,
        actorUserId: 'u1',
      }),
    ).rejects.toBeInstanceOf(ItemCodeExistsException);
  });
});
