import { UpdateItemUseCase } from './UpdateItemUseCase';
import { CreateItemUseCase } from './CreateItemUseCase';
import { FakeItemRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { ItemNotFoundException, ItemTrackingFlagsLockedException } from '../../domain/exceptions/WarehouseExceptions';

function buildSut() {
  const itemRepository = new FakeItemRepository();
  const auditService = new FakeAuditService();
  const createItemUseCase = new CreateItemUseCase(itemRepository, auditService);
  const useCase = new UpdateItemUseCase(itemRepository, auditService);
  return { itemRepository, createItemUseCase, useCase };
}

describe('UpdateItemUseCase (task-097)', () => {
  it('rejects updating a non-existent item', async () => {
    const { useCase } = buildSut();
    await expect(useCase.execute({ itemId: 'missing', name: 'X', actorUserId: 'u1' })).rejects.toBeInstanceOf(ItemNotFoundException);
  });

  it('updates minimum stock and name', async () => {
    const { createItemUseCase, useCase } = buildSut();
    const item = await createItemUseCase.execute({
      code: 'MAT-004',
      name: 'Original Name',
      categoryId: 'cat-1',
      unitId: 'unit-1',
      minimumStock: 5,
      isConsumable: true,
      isBatchTracked: false,
      isExpiryTracked: false,
      actorUserId: 'u1',
    });

    const updated = await useCase.execute({ itemId: item.id, name: 'Updated Name', minimumStock: 15, actorUserId: 'u1' });

    expect(updated.name).toBe('Updated Name');
    expect(updated.minimumStock).toBe(15);
  });

  it('rejects changing isBatchTracked when the item already has stock ledger entries', async () => {
    const { itemRepository, createItemUseCase, useCase } = buildSut();
    const item = await createItemUseCase.execute({
      code: 'MAT-005',
      name: 'Tracked Item',
      categoryId: 'cat-1',
      unitId: 'unit-1',
      minimumStock: 5,
      isConsumable: true,
      isBatchTracked: true,
      isExpiryTracked: true,
      actorUserId: 'u1',
    });
    itemRepository.ledgerItemIds.add(item.id);

    await expect(useCase.execute({ itemId: item.id, isBatchTracked: false, actorUserId: 'u1' })).rejects.toBeInstanceOf(
      ItemTrackingFlagsLockedException,
    );
  });

  it('allows changing isBatchTracked when the item has no stock ledger entries', async () => {
    const { createItemUseCase, useCase } = buildSut();
    const item = await createItemUseCase.execute({
      code: 'MAT-006',
      name: 'Untracked Item',
      categoryId: 'cat-1',
      unitId: 'unit-1',
      minimumStock: 5,
      isConsumable: true,
      isBatchTracked: true,
      isExpiryTracked: true,
      actorUserId: 'u1',
    });

    const updated = await useCase.execute({ itemId: item.id, isBatchTracked: false, actorUserId: 'u1' });
    expect(updated.isBatchTracked).toBe(false);
  });
});
