import { CreateStockAdjustmentUseCase } from './CreateStockAdjustmentUseCase';
import { ApproveStockAdjustmentUseCase } from './ApproveStockAdjustmentUseCase';
import { PostStockAdjustmentUseCase } from './PostStockAdjustmentUseCase';
import { StockAdjustmentNumberGenerator } from '../services/StockAdjustmentNumberGenerator';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { FakeStockAdjustmentRepository, FakeStockRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { InMemoryEventBus } from '../../../../shared/events/EventBus';
import {
  AdjustmentApprovalRequiredException,
  NegativeStockForbiddenException,
  StockAdjustmentAlreadyPostedException,
  WarehouseSegregationOfDutiesException,
} from '../../domain/exceptions/WarehouseExceptions';

function buildSut() {
  const stockAdjustmentRepository = new FakeStockAdjustmentRepository();
  const stockRepository = new FakeStockRepository();
  const auditService = new FakeAuditService();
  const eventBus = new InMemoryEventBus();
  const createUseCase = new CreateStockAdjustmentUseCase(
    stockAdjustmentRepository,
    new StockAdjustmentNumberGenerator(stockAdjustmentRepository),
    auditService,
  );
  const approveUseCase = new ApproveStockAdjustmentUseCase(stockAdjustmentRepository, auditService);
  const postUseCase = new PostStockAdjustmentUseCase(
    stockAdjustmentRepository,
    stockRepository,
    new StockTransactionNumberGenerator(stockRepository),
    auditService,
    eventBus,
  );
  return { stockRepository, createUseCase, approveUseCase, postUseCase, eventBus };
}

describe('Stock Adjustment lifecycle (task-121-124, UC-WHS-005)', () => {
  it('rejects self-approval', async () => {
    const { createUseCase, approveUseCase } = buildSut();
    const adjustment = await createUseCase.execute({
      warehouseId: 'wh-1',
      direction: 'IN',
      reasonCode: 'FOUND_SURPLUS',
      items: [{ itemId: 'item-1', quantity: 5 }],
      actorUserId: 'staff-1',
    });
    await expect(approveUseCase.execute({ adjustmentId: adjustment.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      WarehouseSegregationOfDutiesException,
    );
  });

  it('rejects posting before approval', async () => {
    const { createUseCase, postUseCase } = buildSut();
    const adjustment = await createUseCase.execute({
      warehouseId: 'wh-1',
      direction: 'IN',
      reasonCode: 'FOUND_SURPLUS',
      items: [{ itemId: 'item-1', quantity: 5 }],
      actorUserId: 'staff-1',
    });
    await expect(postUseCase.execute({ adjustmentId: adjustment.id, actorUserId: 'manager-1' })).rejects.toBeInstanceOf(
      AdjustmentApprovalRequiredException,
    );
  });

  it('rejects an OUT adjustment that would drive stock negative', async () => {
    const { createUseCase, approveUseCase, postUseCase } = buildSut();
    const adjustment = await createUseCase.execute({
      warehouseId: 'wh-1',
      direction: 'OUT',
      reasonCode: 'DAMAGED',
      items: [{ itemId: 'item-1', quantity: 999 }],
      actorUserId: 'staff-1',
    });
    await approveUseCase.execute({ adjustmentId: adjustment.id, actorUserId: 'manager-1' });
    await expect(postUseCase.execute({ adjustmentId: adjustment.id, actorUserId: 'manager-1' })).rejects.toBeInstanceOf(
      NegativeStockForbiddenException,
    );
  });

  it('posts an IN adjustment, updates the balance, publishes an event, and rejects reposting', async () => {
    const { stockRepository, createUseCase, approveUseCase, postUseCase, eventBus } = buildSut();
    let publishedEvent: unknown = null;
    eventBus.subscribe('warehouse.stock-adjusted.v1', (payload) => {
      publishedEvent = payload;
    });

    const adjustment = await createUseCase.execute({
      warehouseId: 'wh-1',
      direction: 'IN',
      reasonCode: 'FOUND_SURPLUS',
      items: [{ itemId: 'item-1', quantity: 8 }],
      actorUserId: 'staff-1',
    });
    await approveUseCase.execute({ adjustmentId: adjustment.id, actorUserId: 'manager-1' });
    const posted = await postUseCase.execute({ adjustmentId: adjustment.id, actorUserId: 'manager-1' });

    expect(posted.status).toBe('POSTED');
    expect(publishedEvent).not.toBeNull();
    const stock = await stockRepository.findByWarehouseAndItem('wh-1', 'item-1');
    expect(Number(stock?.currentStock)).toBe(8);

    await expect(postUseCase.execute({ adjustmentId: adjustment.id, actorUserId: 'manager-1' })).rejects.toBeInstanceOf(
      StockAdjustmentAlreadyPostedException,
    );
  });
});
