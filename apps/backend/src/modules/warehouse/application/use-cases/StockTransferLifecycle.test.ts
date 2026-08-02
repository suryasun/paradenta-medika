import { CreateStockTransferUseCase } from './CreateStockTransferUseCase';
import { SubmitStockTransferUseCase } from './SubmitStockTransferUseCase';
import { ApproveStockTransferUseCase } from './ApproveStockTransferUseCase';
import { DispatchStockTransferUseCase } from './DispatchStockTransferUseCase';
import { ReceiveStockTransferUseCase } from './ReceiveStockTransferUseCase';
import { StockTransferNumberGenerator } from '../services/StockTransferNumberGenerator';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { FakeStockRepository, FakeStockTransferRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import {
  SourceDestinationSameException,
  StockInsufficientException,
  StockTransferAlreadyReceivedException,
  StockTransferNotInStatusException,
  WarehouseSegregationOfDutiesException,
} from '../../domain/exceptions/WarehouseExceptions';

function buildSut() {
  const stockTransferRepository = new FakeStockTransferRepository();
  const stockRepository = new FakeStockRepository();
  const auditService = new FakeAuditService();
  const createUseCase = new CreateStockTransferUseCase(
    stockTransferRepository,
    new StockTransferNumberGenerator(stockTransferRepository),
    auditService,
  );
  const submitUseCase = new SubmitStockTransferUseCase(stockTransferRepository, auditService);
  const approveUseCase = new ApproveStockTransferUseCase(stockTransferRepository, auditService);
  const dispatchUseCase = new DispatchStockTransferUseCase(
    stockTransferRepository,
    stockRepository,
    new StockTransactionNumberGenerator(stockRepository),
    auditService,
  );
  const receiveUseCase = new ReceiveStockTransferUseCase(
    stockTransferRepository,
    stockRepository,
    new StockTransactionNumberGenerator(stockRepository),
    auditService,
  );
  return { stockRepository, createUseCase, submitUseCase, approveUseCase, dispatchUseCase, receiveUseCase };
}

async function seedSourceStock(stockRepository: FakeStockRepository, warehouseId: string, itemId: string, quantity: number) {
  await stockRepository.applyStockMovement({
    transactionNumber: 'SEED-0001',
    warehouseId,
    itemId,
    transactionType: 'ADJUSTMENT',
    referenceType: 'SEED',
    referenceId: 'seed-1',
    qtyIn: quantity,
    transactionDate: new Date(),
    performedBy: 'seed',
  });
}

describe('Stock Transfer lifecycle (task-115-120, UC-WHS-004)', () => {
  it('rejects transferring to the same warehouse', async () => {
    const { createUseCase } = buildSut();
    await expect(
      createUseCase.execute({
        sourceWarehouseId: 'wh-1',
        destinationWarehouseId: 'wh-1',
        items: [{ itemId: 'item-1', quantity: 5 }],
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(SourceDestinationSameException);
  });

  it('rejects self-approval', async () => {
    const { createUseCase, submitUseCase, approveUseCase } = buildSut();
    const transfer = await createUseCase.execute({
      sourceWarehouseId: 'wh-1',
      destinationWarehouseId: 'wh-2',
      items: [{ itemId: 'item-1', quantity: 5 }],
      actorUserId: 'staff-1',
    });
    await submitUseCase.execute({ transferId: transfer.id, actorUserId: 'staff-1' });
    await expect(approveUseCase.execute({ transferId: transfer.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      WarehouseSegregationOfDutiesException,
    );
  });

  it('rejects dispatch when source stock is insufficient', async () => {
    const { createUseCase, submitUseCase, approveUseCase, dispatchUseCase } = buildSut();
    const transfer = await createUseCase.execute({
      sourceWarehouseId: 'wh-1',
      destinationWarehouseId: 'wh-2',
      items: [{ itemId: 'item-1', quantity: 999 }],
      actorUserId: 'staff-1',
    });
    await submitUseCase.execute({ transferId: transfer.id, actorUserId: 'staff-1' });
    await approveUseCase.execute({ transferId: transfer.id, actorUserId: 'manager-1' });

    await expect(dispatchUseCase.execute({ transferId: transfer.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      StockInsufficientException,
    );
  });

  it('moves stock from source to destination end-to-end and rejects a duplicate receive', async () => {
    const { stockRepository, createUseCase, submitUseCase, approveUseCase, dispatchUseCase, receiveUseCase } = buildSut();
    await seedSourceStock(stockRepository, 'wh-1', 'item-1', 10);

    const transfer = await createUseCase.execute({
      sourceWarehouseId: 'wh-1',
      destinationWarehouseId: 'wh-2',
      items: [{ itemId: 'item-1', quantity: 6 }],
      actorUserId: 'staff-1',
    });
    await submitUseCase.execute({ transferId: transfer.id, actorUserId: 'staff-1' });
    await approveUseCase.execute({ transferId: transfer.id, actorUserId: 'manager-1' });
    await dispatchUseCase.execute({ transferId: transfer.id, actorUserId: 'staff-1' });
    const received = await receiveUseCase.execute({ transferId: transfer.id, actorUserId: 'staff-2' });

    expect(received.status).toBe('RECEIVED');
    const sourceStock = await stockRepository.findByWarehouseAndItem('wh-1', 'item-1');
    const destStock = await stockRepository.findByWarehouseAndItem('wh-2', 'item-1');
    expect(Number(sourceStock?.currentStock)).toBe(4);
    expect(Number(destStock?.currentStock)).toBe(6);

    await expect(receiveUseCase.execute({ transferId: transfer.id, actorUserId: 'staff-2' })).rejects.toBeInstanceOf(
      StockTransferAlreadyReceivedException,
    );
  });

  it('rejects dispatch on a transfer that is not approved', async () => {
    const { createUseCase, dispatchUseCase } = buildSut();
    const transfer = await createUseCase.execute({
      sourceWarehouseId: 'wh-1',
      destinationWarehouseId: 'wh-2',
      items: [{ itemId: 'item-1', quantity: 1 }],
      actorUserId: 'staff-1',
    });
    await expect(dispatchUseCase.execute({ transferId: transfer.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      StockTransferNotInStatusException,
    );
  });
});
