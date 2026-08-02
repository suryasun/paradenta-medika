import { ListStocksUseCase } from './ListStocksUseCase';
import { FakeItemRepository, FakeStockRepository } from '../../../../../tests/fakes/warehouseFakes';
import { StockQueryDto } from '../dtos/StockQueryDto';
import { WarehouseStock } from '@prisma/client';

function buildQuery(overrides: Partial<StockQueryDto> = {}): StockQueryDto {
  const query = new StockQueryDto();
  query.page = 1;
  query.limit = 20;
  query.sort = 'createdAt';
  query.order = 'desc';
  return Object.assign(query, overrides);
}

describe('ListStocksUseCase (task-102)', () => {
  it('reflects current/reserved/available and low-stock status', async () => {
    const stockRepository = new FakeStockRepository();
    const itemRepository = new FakeItemRepository();

    const item = await itemRepository.create({
      itemCode: 'MAT-010',
      itemName: 'Low Stock Item',
      categoryId: 'cat-1',
      unitId: 'unit-1',
      minimumStock: 10,
      isConsumable: true,
      isBatchTracked: false,
      isExpiryTracked: false,
      createdBy: 'u1',
    });

    const stock: WarehouseStock = {
      id: 'stock-1',
      warehouseId: 'wh-1',
      itemId: item.id,
      currentStock: 5 as never,
      reservedStock: 0 as never,
      availableStock: 5 as never,
      minimumStock: null,
      version: 0,
      lastTransactionAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WarehouseStock;
    stockRepository.stocks.set(stock.id, stock);

    const useCase = new ListStocksUseCase(stockRepository, itemRepository);
    const result = await useCase.execute(buildQuery());

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe('LOW_STOCK');
    expect(result.items[0].availableStock).toBe(5);
  });
});
