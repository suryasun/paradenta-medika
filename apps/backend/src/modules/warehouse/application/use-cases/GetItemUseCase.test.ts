import { GetItemUseCase } from './GetItemUseCase';
import { CreateItemUseCase } from './CreateItemUseCase';
import { FakeItemRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { ItemNotFoundException } from '../../domain/exceptions/WarehouseExceptions';

describe('GetItemUseCase (task-097)', () => {
  it('returns 404-equivalent exception when the item does not exist', async () => {
    const itemRepository = new FakeItemRepository();
    const useCase = new GetItemUseCase(itemRepository);
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(ItemNotFoundException);
  });

  it('returns the item when it exists', async () => {
    const itemRepository = new FakeItemRepository();
    const auditService = new FakeAuditService();
    const created = await new CreateItemUseCase(itemRepository, auditService).execute({
      code: 'MAT-007',
      name: 'Findable Item',
      categoryId: 'cat-1',
      unitId: 'unit-1',
      minimumStock: 1,
      isConsumable: true,
      isBatchTracked: false,
      isExpiryTracked: false,
      actorUserId: 'u1',
    });

    const useCase = new GetItemUseCase(itemRepository);
    const found = await useCase.execute(created.id);
    expect(found.code).toBe('MAT-007');
  });
});
