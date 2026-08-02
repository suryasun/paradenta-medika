import { QuarantineBatchUseCase } from './QuarantineBatchUseCase';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { FakeBatchRepository, FakeStockRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { BatchNotActiveException, BatchNotFoundException } from '../../domain/exceptions/WarehouseExceptions';

function buildSut() {
  const batchRepository = new FakeBatchRepository();
  const stockRepository = new FakeStockRepository();
  const auditService = new FakeAuditService();
  const quarantineUseCase = new QuarantineBatchUseCase(
    batchRepository,
    stockRepository,
    new StockTransactionNumberGenerator(stockRepository),
    auditService,
  );
  return { batchRepository, stockRepository, quarantineUseCase };
}

describe('Batch Quarantine (task-134-135)', () => {
  it('404s quarantining a non-existent batch', async () => {
    const { quarantineUseCase } = buildSut();
    await expect(quarantineUseCase.execute({ batchId: 'missing', actorUserId: 'staff-1' })).rejects.toBeInstanceOf(BatchNotFoundException);
  });

  it('quarantines an active batch: reduces availableStock, keeps currentStock unchanged', async () => {
    const { batchRepository, stockRepository, quarantineUseCase } = buildSut();
    await stockRepository.applyStockMovement({
      transactionNumber: 'SEED-0001',
      warehouseId: 'wh-1',
      itemId: 'item-1',
      transactionType: 'ADJUSTMENT',
      referenceType: 'SEED',
      referenceId: 'seed-1',
      qtyIn: 20,
      transactionDate: new Date(),
      performedBy: 'seed',
    });
    const batch = await batchRepository.upsertReceipt({
      warehouseId: 'wh-1',
      itemId: 'item-1',
      batchNumber: 'RES-2607-A',
      receivedDate: new Date('2026-07-01'),
      expiryDate: new Date('2026-07-15'),
      quantity: 8,
      createdBy: 'staff-1',
    });

    const quarantined = await quarantineUseCase.execute({ batchId: batch.id, actorUserId: 'manager-1' });
    expect(quarantined.status).toBe('QUARANTINED');

    const stock = await stockRepository.findByWarehouseAndItem('wh-1', 'item-1');
    expect(Number(stock?.currentStock)).toBe(20);
    expect(Number(stock?.reservedStock)).toBe(8);
    expect(Number(stock?.availableStock)).toBe(12);
  });

  it('rejects quarantining a batch that is already quarantined', async () => {
    const { batchRepository, stockRepository, quarantineUseCase } = buildSut();
    await stockRepository.applyStockMovement({
      transactionNumber: 'SEED-0002',
      warehouseId: 'wh-1',
      itemId: 'item-1',
      transactionType: 'ADJUSTMENT',
      referenceType: 'SEED',
      referenceId: 'seed-2',
      qtyIn: 20,
      transactionDate: new Date(),
      performedBy: 'seed',
    });
    const batch = await batchRepository.upsertReceipt({
      warehouseId: 'wh-1',
      itemId: 'item-1',
      batchNumber: 'RES-2607-B',
      receivedDate: new Date('2026-07-01'),
      expiryDate: new Date('2026-07-15'),
      quantity: 5,
      createdBy: 'staff-1',
    });
    await quarantineUseCase.execute({ batchId: batch.id, actorUserId: 'manager-1' });

    await expect(quarantineUseCase.execute({ batchId: batch.id, actorUserId: 'manager-1' })).rejects.toBeInstanceOf(
      BatchNotActiveException,
    );
  });
});
