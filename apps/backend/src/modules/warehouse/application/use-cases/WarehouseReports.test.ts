import { GetStockCardReportUseCase } from './GetStockCardReportUseCase';
import { GetStockBalanceReportUseCase } from './GetStockBalanceReportUseCase';
import { GetMovementsReportUseCase } from './GetMovementsReportUseCase';
import { GetPurchasesReportUseCase } from './GetPurchasesReportUseCase';
import { GetExpiryReportUseCase } from './GetExpiryReportUseCase';
import { GetOpnamesReportUseCase } from './GetOpnamesReportUseCase';
import { CreateStockOpnameUseCase } from './CreateStockOpnameUseCase';
import { StockOpnameNumberGenerator } from '../services/StockOpnameNumberGenerator';
import {
  FakeBatchRepository,
  FakeItemRepository,
  FakePurchaseOrderRepository,
  FakeStockOpnameRepository,
  FakeStockRepository,
  FakeWarehouseReportRepository,
} from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';

function buildSut() {
  const stockRepository = new FakeStockRepository();
  const itemRepository = new FakeItemRepository();
  const purchaseOrderRepository = new FakePurchaseOrderRepository();
  const batchRepository = new FakeBatchRepository();
  const stockOpnameRepository = new FakeStockOpnameRepository();
  const reportRepository = new FakeWarehouseReportRepository(stockRepository, purchaseOrderRepository);

  return {
    stockRepository,
    itemRepository,
    purchaseOrderRepository,
    batchRepository,
    stockOpnameRepository,
    stockCardUseCase: new GetStockCardReportUseCase(reportRepository),
    stockBalanceUseCase: new GetStockBalanceReportUseCase(stockRepository, itemRepository),
    movementsUseCase: new GetMovementsReportUseCase(reportRepository),
    purchasesUseCase: new GetPurchasesReportUseCase(reportRepository),
    expiryUseCase: new GetExpiryReportUseCase(batchRepository),
    opnamesUseCase: new GetOpnamesReportUseCase(stockOpnameRepository),
  };
}

describe('Warehouse Reports (task-137-142, SAD Section 6.5/10.2)', () => {
  it('stock card returns the immutable in/out/balance ledger for one item/warehouse pair', async () => {
    const { stockRepository, stockCardUseCase } = buildSut();
    await stockRepository.applyStockMovement({
      transactionNumber: 'TX-0001',
      warehouseId: 'wh-1',
      itemId: 'item-1',
      transactionType: 'ADJUSTMENT',
      referenceType: 'SEED',
      referenceId: 'seed-1',
      qtyIn: 10,
      transactionDate: new Date('2026-08-01'),
      performedBy: 'staff-1',
    });
    await stockRepository.applyStockMovement({
      transactionNumber: 'TX-0002',
      warehouseId: 'wh-1',
      itemId: 'item-1',
      transactionType: 'ADJUSTMENT',
      referenceType: 'SEED',
      referenceId: 'seed-2',
      qtyOut: 3,
      transactionDate: new Date('2026-08-02'),
      performedBy: 'staff-1',
    });
    // Different item -- must not appear on item-1's card.
    await stockRepository.applyStockMovement({
      transactionNumber: 'TX-0003',
      warehouseId: 'wh-1',
      itemId: 'item-2',
      transactionType: 'ADJUSTMENT',
      referenceType: 'SEED',
      referenceId: 'seed-3',
      qtyIn: 99,
      transactionDate: new Date('2026-08-02'),
      performedBy: 'staff-1',
    });

    const { items, total } = await stockCardUseCase.execute({
      warehouseId: 'wh-1',
      itemId: 'item-1',
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });

    expect(total).toBe(2);
    expect(items[0].balance).toBe(10);
    expect(items[1].balance).toBe(7);
  });

  it('stock balance report matches the current/reserved/available/minimum/status shape', async () => {
    const { stockRepository, itemRepository, stockBalanceUseCase } = buildSut();
    const item = await itemRepository.create({
      itemCode: 'MAT-1',
      itemName: 'Material',
      categoryId: 'cat-1',
      unitId: 'unit-1',
      minimumStock: 5,
      isConsumable: true,
      isBatchTracked: false,
      isExpiryTracked: false,
      createdBy: 'u1',
    });
    await stockRepository.applyStockMovement({
      transactionNumber: 'TX-0001',
      warehouseId: 'wh-1',
      itemId: item.id,
      transactionType: 'ADJUSTMENT',
      referenceType: 'SEED',
      referenceId: 'seed-1',
      qtyIn: 2,
      transactionDate: new Date(),
      performedBy: 'staff-1',
    });

    const { items } = await stockBalanceUseCase.execute({ page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(items[0].currentStock).toBe(2);
    expect(items[0].status).toBe('LOW_STOCK');
  });

  it('movements report filters by transactionType and actor', async () => {
    const { stockRepository, movementsUseCase } = buildSut();
    await stockRepository.applyStockMovement({
      transactionNumber: 'TX-0001',
      warehouseId: 'wh-1',
      itemId: 'item-1',
      transactionType: 'PURCHASE',
      referenceType: 'GOODS_RECEIPT',
      referenceId: 'gr-1',
      qtyIn: 10,
      transactionDate: new Date(),
      performedBy: 'staff-1',
    });
    await stockRepository.applyStockMovement({
      transactionNumber: 'TX-0002',
      warehouseId: 'wh-1',
      itemId: 'item-1',
      transactionType: 'ADJUSTMENT',
      referenceType: 'STOCK_ADJUSTMENT',
      referenceId: 'adj-1',
      qtyOut: 1,
      transactionDate: new Date(),
      performedBy: 'staff-2',
    });

    const { items, total } = await movementsUseCase.execute({
      transactionType: 'PURCHASE',
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });
    expect(total).toBe(1);
    expect(items[0].performedBy).toBe('staff-1');
  });

  it('purchases report aggregates ordered vs received quantity per PO', async () => {
    const { purchaseOrderRepository, purchasesUseCase } = buildSut();
    const po = await purchaseOrderRepository.create({
      purchaseOrderNumber: 'PO-TEST-0001',
      supplierId: 'sup-1',
      branchId: 'branch-1',
      warehouseId: 'wh-1',
      items: [{ itemId: 'item-1', quantity: 10, unitPrice: 1000 }],
      createdBy: 'requester-1',
    });
    await purchaseOrderRepository.incrementReceivedQuantity(po.items[0].id, 4);

    const { items } = await purchasesUseCase.execute({ page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    const row = items.find((r) => r.purchaseOrderId === po.id);
    expect(row?.orderedQuantity).toBe(10);
    expect(row?.receivedQuantity).toBe(4);
  });

  it('expiry report reuses batch list filtering by status', async () => {
    const { batchRepository, expiryUseCase } = buildSut();
    await batchRepository.upsertReceipt({
      warehouseId: 'wh-1',
      itemId: 'item-1',
      batchNumber: 'LOT-A',
      receivedDate: new Date('2026-07-01'),
      expiryDate: new Date('2026-08-05'),
      quantity: 5,
      createdBy: 'staff-1',
    });

    const { items, total } = await expiryUseCase.execute({ status: 'ACTIVE', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(total).toBe(1);
    expect(items[0].batchNumber).toBe('LOT-A');
  });

  it('opnames report reuses opname list with snapshot/variance/approval fields', async () => {
    const { stockOpnameRepository, opnamesUseCase } = buildSut();
    const createUseCase = new CreateStockOpnameUseCase(
      stockOpnameRepository,
      new StockOpnameNumberGenerator(stockOpnameRepository),
      new FakeAuditService(),
    );
    await createUseCase.execute({ warehouseId: 'wh-1', opnameDate: '2026-08-02', items: ['item-1'], actorUserId: 'staff-1' });

    const { items, total } = await opnamesUseCase.execute({ warehouseId: 'wh-1', page: 1, limit: 20, sort: 'createdAt', order: 'desc' });
    expect(total).toBe(1);
    expect(items[0].status).toBe('DRAFT');
    expect(items[0].items[0].variance).toBeNull();
  });
});
