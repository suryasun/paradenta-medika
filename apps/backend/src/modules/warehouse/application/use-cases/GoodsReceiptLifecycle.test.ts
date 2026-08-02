import { CreatePurchaseOrderUseCase } from './CreatePurchaseOrderUseCase';
import { SubmitPurchaseOrderUseCase } from './SubmitPurchaseOrderUseCase';
import { ApprovePurchaseOrderUseCase } from './ApprovePurchaseOrderUseCase';
import { CreateGoodsReceiptUseCase } from './CreateGoodsReceiptUseCase';
import { GetGoodsReceiptUseCase } from './GetGoodsReceiptUseCase';
import { PostGoodsReceiptUseCase } from './PostGoodsReceiptUseCase';
import { PurchaseOrderNumberGenerator } from '../services/PurchaseOrderNumberGenerator';
import { GoodsReceiptNumberGenerator } from '../services/GoodsReceiptNumberGenerator';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import {
  FakeBatchRepository,
  FakeGoodsReceiptRepository,
  FakeItemRepository,
  FakePurchaseOrderRepository,
  FakeStockRepository,
  FakeWarehouseLocationRepository,
} from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { InMemoryEventBus } from '../../../../shared/events/EventBus';
import {
  BatchRequiredException,
  GoodsReceiptAlreadyPostedException,
  PurchaseOrderNotApprovedException,
  ReceiptOverQuantityException,
} from '../../domain/exceptions/WarehouseExceptions';

async function buildSut() {
  const purchaseOrderRepository = new FakePurchaseOrderRepository();
  const goodsReceiptRepository = new FakeGoodsReceiptRepository();
  const warehouseLocationRepository = new FakeWarehouseLocationRepository();
  const itemRepository = new FakeItemRepository();
  const stockRepository = new FakeStockRepository();
  const batchRepository = new FakeBatchRepository();
  const auditService = new FakeAuditService();
  const eventBus = new InMemoryEventBus();

  const warehouse = await warehouseLocationRepository.create({
    branchId: 'branch-1',
    locationCode: 'WH-01',
    locationName: 'Main Warehouse',
    createdBy: 'u1',
  });
  const trackedItem = await itemRepository.create({
    itemCode: 'MAT-100',
    itemName: 'Tracked Item',
    categoryId: 'cat-1',
    unitId: 'unit-1',
    minimumStock: 5,
    isConsumable: true,
    isBatchTracked: true,
    isExpiryTracked: true,
    createdBy: 'u1',
  });
  const plainItem = await itemRepository.create({
    itemCode: 'MAT-101',
    itemName: 'Plain Item',
    categoryId: 'cat-1',
    unitId: 'unit-1',
    minimumStock: 5,
    isConsumable: true,
    isBatchTracked: false,
    isExpiryTracked: false,
    createdBy: 'u1',
  });

  const createPoUseCase = new CreatePurchaseOrderUseCase(
    purchaseOrderRepository,
    warehouseLocationRepository,
    new PurchaseOrderNumberGenerator(purchaseOrderRepository),
    auditService,
  );
  const submitPoUseCase = new SubmitPurchaseOrderUseCase(purchaseOrderRepository, auditService);
  const approvePoUseCase = new ApprovePurchaseOrderUseCase(purchaseOrderRepository, auditService);
  const createGrUseCase = new CreateGoodsReceiptUseCase(
    purchaseOrderRepository,
    goodsReceiptRepository,
    itemRepository,
    new GoodsReceiptNumberGenerator(goodsReceiptRepository),
    auditService,
  );
  const getGrUseCase = new GetGoodsReceiptUseCase(goodsReceiptRepository);
  const postGrUseCase = new PostGoodsReceiptUseCase(
    goodsReceiptRepository,
    purchaseOrderRepository,
    stockRepository,
    itemRepository,
    batchRepository,
    new StockTransactionNumberGenerator(stockRepository),
    auditService,
    eventBus,
  );

  return {
    purchaseOrderRepository,
    stockRepository,
    batchRepository,
    warehouse,
    trackedItem,
    plainItem,
    createPoUseCase,
    submitPoUseCase,
    approvePoUseCase,
    createGrUseCase,
    getGrUseCase,
    postGrUseCase,
    eventBus,
  };
}

describe('Goods Receipt lifecycle (task-111-114, UC-WHS-002)', () => {
  it('rejects creating a receipt against an unapproved PO', async () => {
    const { warehouse, plainItem, createPoUseCase, createGrUseCase } = await buildSut();
    const po = await createPoUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: plainItem.id, quantity: 10, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });

    await expect(
      createGrUseCase.execute({
        purchaseOrderId: po.id,
        warehouseId: warehouse.id,
        receiptDate: '2026-08-02',
        items: [{ purchaseOrderItemId: po.items[0].id, itemId: plainItem.id, quantity: 5, unitCost: 900 }],
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(PurchaseOrderNotApprovedException);
  });

  it('rejects over-quantity receipt', async () => {
    const { warehouse, plainItem, createPoUseCase, submitPoUseCase, approvePoUseCase, createGrUseCase } = await buildSut();
    const po = await createPoUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: plainItem.id, quantity: 10, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    await submitPoUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' });
    await approvePoUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'manager-1' });

    await expect(
      createGrUseCase.execute({
        purchaseOrderId: po.id,
        warehouseId: warehouse.id,
        receiptDate: '2026-08-02',
        items: [{ purchaseOrderItemId: po.items[0].id, itemId: plainItem.id, quantity: 999, unitCost: 900 }],
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(ReceiptOverQuantityException);
  });

  it('rejects a batch-tracked item without a batchNumber', async () => {
    const { warehouse, trackedItem, createPoUseCase, submitPoUseCase, approvePoUseCase, createGrUseCase } = await buildSut();
    const po = await createPoUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: trackedItem.id, quantity: 10, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    await submitPoUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' });
    await approvePoUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'manager-1' });

    await expect(
      createGrUseCase.execute({
        purchaseOrderId: po.id,
        warehouseId: warehouse.id,
        receiptDate: '2026-08-02',
        items: [{ purchaseOrderItemId: po.items[0].id, itemId: trackedItem.id, quantity: 5, unitCost: 900 }],
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(BatchRequiredException);
  });

  it('posts a receipt, increments the stock ledger, and marks the PO fully received', async () => {
    const { purchaseOrderRepository, stockRepository, warehouse, plainItem, createPoUseCase, submitPoUseCase, approvePoUseCase, createGrUseCase, postGrUseCase, eventBus } =
      await buildSut();
    let publishedEvent: unknown = null;
    eventBus.subscribe('warehouse.goods-receipt.posted.v1', (payload) => {
      publishedEvent = payload;
    });

    const po = await createPoUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: plainItem.id, quantity: 10, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    await submitPoUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' });
    await approvePoUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'manager-1' });

    const receipt = await createGrUseCase.execute({
      purchaseOrderId: po.id,
      warehouseId: warehouse.id,
      receiptDate: '2026-08-02',
      items: [{ purchaseOrderItemId: po.items[0].id, itemId: plainItem.id, quantity: 10, unitCost: 900 }],
      actorUserId: 'staff-1',
    });

    const posted = await postGrUseCase.execute({ goodsReceiptId: receipt.id, actorUserId: 'staff-1' });
    expect(posted.status).toBe('POSTED');
    expect(publishedEvent).not.toBeNull();

    const updatedPo = await purchaseOrderRepository.findById(po.id);
    expect(updatedPo?.status).toBe('RECEIVED');

    const stock = [...stockRepository.stocks.values()].find((s) => s.warehouseId === warehouse.id && s.itemId === plainItem.id);
    expect(Number(stock?.currentStock)).toBe(10);
  });

  it('rejects reposting an already-posted receipt', async () => {
    const { warehouse, plainItem, createPoUseCase, submitPoUseCase, approvePoUseCase, createGrUseCase, postGrUseCase } = await buildSut();
    const po = await createPoUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: plainItem.id, quantity: 10, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    await submitPoUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' });
    await approvePoUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'manager-1' });
    const receipt = await createGrUseCase.execute({
      purchaseOrderId: po.id,
      warehouseId: warehouse.id,
      receiptDate: '2026-08-02',
      items: [{ purchaseOrderItemId: po.items[0].id, itemId: plainItem.id, quantity: 10, unitCost: 900 }],
      actorUserId: 'staff-1',
    });

    await postGrUseCase.execute({ goodsReceiptId: receipt.id, actorUserId: 'staff-1' });
    await expect(postGrUseCase.execute({ goodsReceiptId: receipt.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      GoodsReceiptAlreadyPostedException,
    );
  });

  it('marks the PO PARTIALLY_RECEIVED when a partial quantity is posted', async () => {
    const { purchaseOrderRepository, warehouse, plainItem, createPoUseCase, submitPoUseCase, approvePoUseCase, createGrUseCase, postGrUseCase } =
      await buildSut();
    const po = await createPoUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: plainItem.id, quantity: 10, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    await submitPoUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' });
    await approvePoUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'manager-1' });
    const receipt = await createGrUseCase.execute({
      purchaseOrderId: po.id,
      warehouseId: warehouse.id,
      receiptDate: '2026-08-02',
      items: [{ purchaseOrderItemId: po.items[0].id, itemId: plainItem.id, quantity: 4, unitCost: 900 }],
      actorUserId: 'staff-1',
    });
    await postGrUseCase.execute({ goodsReceiptId: receipt.id, actorUserId: 'staff-1' });

    const updatedPo = await purchaseOrderRepository.findById(po.id);
    expect(updatedPo?.status).toBe('PARTIALLY_RECEIVED');
  });

  it('posts a batch-tracked receipt and creates a linked ItemBatch (task-134)', async () => {
    const { batchRepository, warehouse, trackedItem, createPoUseCase, submitPoUseCase, approvePoUseCase, createGrUseCase, postGrUseCase } =
      await buildSut();
    const po = await createPoUseCase.execute({
      supplierId: 'sup-1',
      warehouseId: warehouse.id,
      items: [{ itemId: trackedItem.id, quantity: 10, unitPrice: 1000 }],
      actorUserId: 'requester-1',
    });
    await submitPoUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'requester-1' });
    await approvePoUseCase.execute({ purchaseOrderId: po.id, actorUserId: 'manager-1' });

    const receipt = await createGrUseCase.execute({
      purchaseOrderId: po.id,
      warehouseId: warehouse.id,
      receiptDate: '2026-08-02',
      items: [
        {
          purchaseOrderItemId: po.items[0].id,
          itemId: trackedItem.id,
          quantity: 10,
          unitCost: 900,
          batchNumber: 'RES-2607-A',
          expiryDate: '2027-01-01',
        },
      ],
      actorUserId: 'staff-1',
    });
    await postGrUseCase.execute({ goodsReceiptId: receipt.id, actorUserId: 'staff-1' });

    const batch = [...batchRepository.batches.values()].find(
      (b) => b.warehouseId === warehouse.id && b.itemId === trackedItem.id && b.batchNumber === 'RES-2607-A',
    );
    expect(batch).toBeDefined();
    expect(Number(batch?.remainingQuantity)).toBe(10);
    expect(batch?.status).toBe('ACTIVE');
  });
});
