import { CreateStockOpnameUseCase } from './CreateStockOpnameUseCase';
import { UpdateStockOpnameUseCase } from './UpdateStockOpnameUseCase';
import { StartStockOpnameCountUseCase } from './StartStockOpnameCountUseCase';
import { SubmitStockOpnameUseCase } from './SubmitStockOpnameUseCase';
import { ApproveStockOpnameUseCase } from './ApproveStockOpnameUseCase';
import { PostStockOpnameUseCase } from './PostStockOpnameUseCase';
import { StockOpnameNumberGenerator } from '../services/StockOpnameNumberGenerator';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { FakeStockOpnameRepository, FakeStockRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { InMemoryEventBus } from '../../../../shared/events/EventBus';
import {
  NegativeStockForbiddenException,
  StockOpnameAlreadyActiveException,
  StockOpnameAlreadyPostedException,
  StockOpnameItemNotInScopeException,
  StockOpnameNotInStatusException,
  WarehouseSegregationOfDutiesException,
} from '../../domain/exceptions/WarehouseExceptions';

function buildSut() {
  const stockOpnameRepository = new FakeStockOpnameRepository();
  const stockRepository = new FakeStockRepository();
  const auditService = new FakeAuditService();
  const eventBus = new InMemoryEventBus();
  const createUseCase = new CreateStockOpnameUseCase(stockOpnameRepository, new StockOpnameNumberGenerator(stockOpnameRepository), auditService);
  const updateUseCase = new UpdateStockOpnameUseCase(stockOpnameRepository, auditService);
  const startCountUseCase = new StartStockOpnameCountUseCase(stockOpnameRepository, stockRepository, auditService);
  const submitUseCase = new SubmitStockOpnameUseCase(stockOpnameRepository, auditService);
  const approveUseCase = new ApproveStockOpnameUseCase(stockOpnameRepository, auditService);
  const postUseCase = new PostStockOpnameUseCase(
    stockOpnameRepository,
    stockRepository,
    new StockTransactionNumberGenerator(stockRepository),
    auditService,
    eventBus,
  );
  return { stockRepository, createUseCase, updateUseCase, startCountUseCase, submitUseCase, approveUseCase, postUseCase, eventBus };
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
    transactionDate: new Date(),
    performedBy: 'seed',
  });
}

describe('Stock Opname lifecycle (task-127-133, UC-WHS-006)', () => {
  it('rejects creating a second active opname for the same warehouse/date', async () => {
    const { createUseCase } = buildSut();
    await createUseCase.execute({ warehouseId: 'wh-1', opnameDate: '2026-08-02', items: ['item-1'], actorUserId: 'staff-1' });

    await expect(
      createUseCase.execute({ warehouseId: 'wh-1', opnameDate: '2026-08-02', items: ['item-2'], actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(StockOpnameAlreadyActiveException);
  });

  it('rejects updating scope once counting has started', async () => {
    const { stockRepository, createUseCase, startCountUseCase, updateUseCase } = buildSut();
    await seedStock(stockRepository, 'wh-1', 'item-1', 10);
    const opname = await createUseCase.execute({ warehouseId: 'wh-1', opnameDate: '2026-08-02', items: ['item-1'], actorUserId: 'staff-1' });
    await startCountUseCase.execute({ opnameId: opname.id, actorUserId: 'staff-1' });

    await expect(
      updateUseCase.execute({ opnameId: opname.id, notes: 'late edit', actorUserId: 'staff-1' }),
    ).rejects.toBeInstanceOf(StockOpnameNotInStatusException);
  });

  it('freezes the system quantity snapshot on start-count', async () => {
    const { stockRepository, createUseCase, startCountUseCase } = buildSut();
    await seedStock(stockRepository, 'wh-1', 'item-1', 25);
    const opname = await createUseCase.execute({ warehouseId: 'wh-1', opnameDate: '2026-08-02', items: ['item-1'], actorUserId: 'staff-1' });

    const started = await startCountUseCase.execute({ opnameId: opname.id, actorUserId: 'staff-1' });
    expect(started.status).toBe('COUNTING');
    expect(started.items[0].systemQuantity).toBe(25);
  });

  it('rejects a submit line for an item outside the opname scope', async () => {
    const { stockRepository, createUseCase, startCountUseCase, submitUseCase } = buildSut();
    await seedStock(stockRepository, 'wh-1', 'item-1', 10);
    const opname = await createUseCase.execute({ warehouseId: 'wh-1', opnameDate: '2026-08-02', items: ['item-1'], actorUserId: 'staff-1' });
    await startCountUseCase.execute({ opnameId: opname.id, actorUserId: 'staff-1' });

    await expect(
      submitUseCase.execute({
        opnameId: opname.id,
        items: [{ itemId: 'item-not-in-scope', physicalQuantity: 5 }],
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(StockOpnameItemNotInScopeException);
  });

  it('computes variance on submit and rejects self-approval', async () => {
    const { stockRepository, createUseCase, startCountUseCase, submitUseCase, approveUseCase } = buildSut();
    await seedStock(stockRepository, 'wh-1', 'item-1', 10);
    const opname = await createUseCase.execute({ warehouseId: 'wh-1', opnameDate: '2026-08-02', items: ['item-1'], actorUserId: 'staff-1' });
    await startCountUseCase.execute({ opnameId: opname.id, actorUserId: 'staff-1' });

    const submitted = await submitUseCase.execute({
      opnameId: opname.id,
      items: [{ itemId: 'item-1', physicalQuantity: 7 }],
      actorUserId: 'staff-1',
    });
    expect(submitted.status).toBe('SUBMITTED');
    expect(submitted.items[0].variance).toBe(-3);

    await expect(approveUseCase.execute({ opnameId: opname.id, actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      WarehouseSegregationOfDutiesException,
    );
  });

  it('rejects posting a shortage variance that would drive stock negative', async () => {
    const { stockRepository, createUseCase, startCountUseCase, submitUseCase, approveUseCase, postUseCase } = buildSut();
    await seedStock(stockRepository, 'wh-1', 'item-1', 5);
    const opname = await createUseCase.execute({ warehouseId: 'wh-1', opnameDate: '2026-08-02', items: ['item-1'], actorUserId: 'staff-1' });
    await startCountUseCase.execute({ opnameId: opname.id, actorUserId: 'staff-1' });
    await submitUseCase.execute({ opnameId: opname.id, items: [{ itemId: 'item-1', physicalQuantity: 0 }], actorUserId: 'staff-1' });
    await approveUseCase.execute({ opnameId: opname.id, actorUserId: 'manager-1' });

    // Simulate stock moving between submit and post so posting the recorded variance would go negative.
    await stockRepository.applyStockMovement({
      transactionNumber: 'DRAIN-0001',
      warehouseId: 'wh-1',
      itemId: 'item-1',
      transactionType: 'ADJUSTMENT',
      referenceType: 'OTHER',
      referenceId: 'other-1',
      qtyOut: 5,
      transactionDate: new Date(),
      performedBy: 'other-actor',
    });

    await expect(postUseCase.execute({ opnameId: opname.id, actorUserId: 'manager-1' })).rejects.toBeInstanceOf(
      NegativeStockForbiddenException,
    );
  });

  it('posts a surplus variance, updates the balance, publishes an event, and rejects reposting', async () => {
    const { stockRepository, createUseCase, startCountUseCase, submitUseCase, approveUseCase, postUseCase, eventBus } = buildSut();
    let publishedEvent: unknown = null;
    eventBus.subscribe('warehouse.stock-opname-approved.v1', (payload) => {
      publishedEvent = payload;
    });

    await seedStock(stockRepository, 'wh-1', 'item-1', 10);
    const opname = await createUseCase.execute({ warehouseId: 'wh-1', opnameDate: '2026-08-02', items: ['item-1'], actorUserId: 'staff-1' });
    await startCountUseCase.execute({ opnameId: opname.id, actorUserId: 'staff-1' });
    await submitUseCase.execute({ opnameId: opname.id, items: [{ itemId: 'item-1', physicalQuantity: 14 }], actorUserId: 'staff-1' });
    await approveUseCase.execute({ opnameId: opname.id, actorUserId: 'manager-1' });

    const posted = await postUseCase.execute({ opnameId: opname.id, actorUserId: 'manager-1' });
    expect(posted.status).toBe('POSTED');
    expect(publishedEvent).not.toBeNull();

    const stock = await stockRepository.findByWarehouseAndItem('wh-1', 'item-1');
    expect(Number(stock?.currentStock)).toBe(14);

    await expect(postUseCase.execute({ opnameId: opname.id, actorUserId: 'manager-1' })).rejects.toBeInstanceOf(
      StockOpnameAlreadyPostedException,
    );
  });
});
