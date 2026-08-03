import { ConsumeMaterialUseCase } from './ConsumeMaterialUseCase';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { FakeBatchRepository, FakeItemRepository, FakeStockRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { FakeEventBus } from '../../../../../tests/fakes/patientFakes';
import {
  BatchExpiredException,
  ItemNotConsumableException,
  MaterialConsumptionAlreadyProcessedException,
  StockInsufficientException,
} from '../../domain/exceptions/WarehouseExceptions';

function buildSut() {
  const stockRepository = new FakeStockRepository();
  const itemRepository = new FakeItemRepository();
  const batchRepository = new FakeBatchRepository();
  const auditService = new FakeAuditService();
  const eventBus = new FakeEventBus();
  const useCase = new ConsumeMaterialUseCase(
    stockRepository,
    itemRepository,
    batchRepository,
    new StockTransactionNumberGenerator(stockRepository),
    auditService,
    eventBus,
  );
  return { stockRepository, itemRepository, batchRepository, auditService, eventBus, useCase };
}

async function seedStock(stockRepository: FakeStockRepository, warehouseId: string, itemId: string, quantity: number) {
  await stockRepository.applyStockMovement({
    transactionNumber: 'SEED-0001',
    warehouseId,
    itemId,
    transactionType: 'ADJUSTMENT',
    referenceType: 'SEED',
    referenceId: 'seed-1',
    qtyIn: quantity,
    transactionDate: new Date('2026-01-01'),
    performedBy: 'seed',
  });
}

describe('ConsumeMaterialUseCase (task-136, Epic Z, UC-WHS-003)', () => {
  it('consumes a non-batch-tracked item by decrementing currentStock and posting one TREATMENT transaction', async () => {
    const { stockRepository, itemRepository, useCase } = buildSut();
    const item = await itemRepository.create({
      itemCode: 'MAT01', itemName: 'Gauze', categoryId: 'c1', unitId: 'u1',
      minimumStock: 0, isConsumable: true, isBatchTracked: false, isExpiryTracked: false, createdBy: 'admin',
    });
    await seedStock(stockRepository, 'wh1', item.id, 10);

    await useCase.execute({
      visitId: 'v1', treatmentId: 't1', visitTreatmentId: 'vt1', warehouseId: 'wh1',
      materials: [{ itemId: item.id, quantity: 3 }], occurredAt: '2026-06-01T00:00:00Z', actorUserId: 'system:test',
    });

    const stock = await stockRepository.findByWarehouseAndItem('wh1', item.id);
    expect(Number(stock?.currentStock)).toBe(7);
  });

  it('rejects a non-batch-tracked item with insufficient stock', async () => {
    const { stockRepository, itemRepository, useCase } = buildSut();
    const item = await itemRepository.create({
      itemCode: 'MAT02', itemName: 'Cotton', categoryId: 'c1', unitId: 'u1',
      minimumStock: 0, isConsumable: true, isBatchTracked: false, isExpiryTracked: false, createdBy: 'admin',
    });
    await seedStock(stockRepository, 'wh1', item.id, 1);

    await expect(
      useCase.execute({
        visitId: 'v1', treatmentId: 't1', visitTreatmentId: 'vt1', warehouseId: 'wh1',
        materials: [{ itemId: item.id, quantity: 5 }], occurredAt: '2026-06-01T00:00:00Z', actorUserId: 'system:test',
      }),
    ).rejects.toBeInstanceOf(StockInsufficientException);
  });

  it('rejects a non-consumable item', async () => {
    const { itemRepository, useCase } = buildSut();
    const item = await itemRepository.create({
      itemCode: 'EQ01', itemName: 'X-Ray Sensor', categoryId: 'c1', unitId: 'u1',
      minimumStock: 0, isConsumable: false, isBatchTracked: false, isExpiryTracked: false, createdBy: 'admin',
    });

    await expect(
      useCase.execute({
        visitId: 'v1', treatmentId: 't1', visitTreatmentId: 'vt1', warehouseId: 'wh1',
        materials: [{ itemId: item.id, quantity: 1 }], occurredAt: '2026-06-01T00:00:00Z', actorUserId: 'system:test',
      }),
    ).rejects.toBeInstanceOf(ItemNotConsumableException);
  });

  it('FEFO: allocates from the earliest-expiring active batch first, spilling into the next batch when one is exhausted', async () => {
    const { stockRepository, itemRepository, batchRepository, useCase } = buildSut();
    const item = await itemRepository.create({
      itemCode: 'MAT03', itemName: 'Anesthetic', categoryId: 'c1', unitId: 'u1',
      minimumStock: 0, isConsumable: true, isBatchTracked: true, isExpiryTracked: true, createdBy: 'admin',
    });
    const earlyBatch = await batchRepository.upsertReceipt({
      warehouseId: 'wh1', itemId: item.id, batchNumber: 'B1', receivedDate: new Date('2026-01-01'), expiryDate: new Date('2026-07-01'), quantity: 2, createdBy: 'admin',
    });
    const lateBatch = await batchRepository.upsertReceipt({
      warehouseId: 'wh1', itemId: item.id, batchNumber: 'B2', receivedDate: new Date('2026-01-01'), expiryDate: new Date('2026-12-01'), quantity: 5, createdBy: 'admin',
    });
    await seedStock(stockRepository, 'wh1', item.id, 7);

    await useCase.execute({
      visitId: 'v1', treatmentId: 't1', visitTreatmentId: 'vt1', warehouseId: 'wh1',
      materials: [{ itemId: item.id, quantity: 4 }], occurredAt: '2026-06-01T00:00:00Z', actorUserId: 'system:test',
    });

    const refreshedEarly = await batchRepository.findById(earlyBatch.id);
    const refreshedLate = await batchRepository.findById(lateBatch.id);
    expect(Number(refreshedEarly?.remainingQuantity)).toBe(0);
    expect(refreshedEarly?.status).toBe('DEPLETED');
    expect(Number(refreshedLate?.remainingQuantity)).toBe(3);
  });

  it('raises WHS_BATCH_EXPIRED when eligible (non-expired) batches cannot cover the quantity but expired stock exists', async () => {
    const { stockRepository, itemRepository, batchRepository, useCase } = buildSut();
    const item = await itemRepository.create({
      itemCode: 'MAT04', itemName: 'Filling Material', categoryId: 'c1', unitId: 'u1',
      minimumStock: 0, isConsumable: true, isBatchTracked: true, isExpiryTracked: true, createdBy: 'admin',
    });
    await batchRepository.upsertReceipt({
      warehouseId: 'wh1', itemId: item.id, batchNumber: 'B1', receivedDate: new Date('2025-01-01'), expiryDate: new Date('2026-01-01'), quantity: 5, createdBy: 'admin',
    });
    await seedStock(stockRepository, 'wh1', item.id, 5);

    await expect(
      useCase.execute({
        visitId: 'v1', treatmentId: 't1', visitTreatmentId: 'vt1', warehouseId: 'wh1',
        materials: [{ itemId: item.id, quantity: 2 }], occurredAt: '2026-06-01T00:00:00Z', actorUserId: 'system:test',
      }),
    ).rejects.toBeInstanceOf(BatchExpiredException);
  });

  it('raises WHS_STOCK_INSUFFICIENT (not WHS_BATCH_EXPIRED) when no batch stock exists at all, expired or not', async () => {
    const { itemRepository, useCase } = buildSut();
    const item = await itemRepository.create({
      itemCode: 'MAT05', itemName: 'Sealant', categoryId: 'c1', unitId: 'u1',
      minimumStock: 0, isConsumable: true, isBatchTracked: true, isExpiryTracked: true, createdBy: 'admin',
    });

    await expect(
      useCase.execute({
        visitId: 'v1', treatmentId: 't1', visitTreatmentId: 'vt1', warehouseId: 'wh1',
        materials: [{ itemId: item.id, quantity: 1 }], occurredAt: '2026-06-01T00:00:00Z', actorUserId: 'system:test',
      }),
    ).rejects.toBeInstanceOf(StockInsufficientException);
  });

  it('publishes warehouse.material-consumed.v1 on success', async () => {
    const { stockRepository, itemRepository, eventBus, useCase } = buildSut();
    const item = await itemRepository.create({
      itemCode: 'MAT06', itemName: 'Gloves', categoryId: 'c1', unitId: 'u1',
      minimumStock: 0, isConsumable: true, isBatchTracked: false, isExpiryTracked: false, createdBy: 'admin',
    });
    await seedStock(stockRepository, 'wh1', item.id, 10);

    await useCase.execute({
      visitId: 'v1', treatmentId: 't1', visitTreatmentId: 'vt1', warehouseId: 'wh1',
      materials: [{ itemId: item.id, quantity: 1 }], occurredAt: '2026-06-01T00:00:00Z', actorUserId: 'system:test',
    });

    expect(eventBus.published.some((e) => e.eventName === 'warehouse.material-consumed.v1')).toBe(true);
  });

  it('idempotent redelivery: a second event for the same visitTreatmentId is rejected without double-consuming stock', async () => {
    const { stockRepository, itemRepository, useCase } = buildSut();
    const item = await itemRepository.create({
      itemCode: 'MAT07', itemName: 'Local Anesthetic', categoryId: 'c1', unitId: 'u1',
      minimumStock: 0, isConsumable: true, isBatchTracked: false, isExpiryTracked: false, createdBy: 'admin',
    });
    await seedStock(stockRepository, 'wh1', item.id, 10);
    const input = {
      visitId: 'v1', treatmentId: 't1', visitTreatmentId: 'vt1', warehouseId: 'wh1',
      materials: [{ itemId: item.id, quantity: 2 }], occurredAt: '2026-06-01T00:00:00Z', actorUserId: 'system:test',
    };

    await useCase.execute(input);
    await expect(useCase.execute(input)).rejects.toBeInstanceOf(MaterialConsumptionAlreadyProcessedException);

    const stock = await stockRepository.findByWarehouseAndItem('wh1', item.id);
    expect(Number(stock?.currentStock)).toBe(8); // not 6 -- redelivery must not double-consume
  });
});
