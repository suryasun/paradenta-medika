import { GetStockLedgerUseCase } from './GetStockLedgerUseCase';
import { FakeStockRepository } from '../../../../../tests/fakes/warehouseFakes';
import { StockNotFoundException } from '../../domain/exceptions/WarehouseExceptions';
import { StockTransaction, WarehouseStock } from '@prisma/client';

describe('GetStockLedgerUseCase (task-103)', () => {
  it('rejects a non-existent stock id', async () => {
    const stockRepository = new FakeStockRepository();
    const useCase = new GetStockLedgerUseCase(stockRepository);
    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(StockNotFoundException);
  });

  it('returns ledger entries in chronological order with running balance', async () => {
    const stockRepository = new FakeStockRepository();
    const stock: WarehouseStock = {
      id: 'stock-1',
      warehouseId: 'wh-1',
      itemId: 'item-1',
      currentStock: 30 as never,
      reservedStock: 0 as never,
      availableStock: 30 as never,
      minimumStock: null,
      version: 0,
      lastTransactionAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as WarehouseStock;
    stockRepository.stocks.set(stock.id, stock);

    const first: StockTransaction = {
      id: 't1',
      transactionNumber: 'STK-0001',
      warehouseId: 'wh-1',
      itemId: 'item-1',
      batchId: null,
      transactionType: 'PURCHASE',
      referenceType: 'GOODS_RECEIPT',
      referenceId: 'gr-1',
      qtyIn: 20 as never,
      qtyOut: 0 as never,
      balance: 20 as never,
      transactionDate: new Date('2026-08-01T00:00:00.000Z'),
      performedBy: 'u1',
      approvedBy: null,
      notes: null,
      createdAt: new Date(),
    } as StockTransaction;
    const second: StockTransaction = {
      ...first,
      id: 't2',
      transactionNumber: 'STK-0002',
      qtyIn: 10 as never,
      balance: 30 as never,
      transactionDate: new Date('2026-08-02T00:00:00.000Z'),
    };
    // Inserted out of order to prove the use case sorts, not just appends.
    stockRepository.transactions.push(second, first);

    const useCase = new GetStockLedgerUseCase(stockRepository);
    const entries = await useCase.execute(stock.id);

    expect(entries.map((e) => e.transactionNumber)).toEqual(['STK-0001', 'STK-0002']);
    expect(entries[entries.length - 1].balance).toBe(30);
  });
});
