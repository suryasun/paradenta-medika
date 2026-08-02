import { ReserveStockUseCase } from './ReserveStockUseCase';
import { ReleaseStockReservationUseCase } from './ReleaseStockReservationUseCase';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { FakeStockRepository, FakeStockReservationRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { StockInsufficientException, StockReservationNotFoundException } from '../../domain/exceptions/WarehouseExceptions';

function buildSut() {
  const stockReservationRepository = new FakeStockReservationRepository();
  const stockRepository = new FakeStockRepository();
  const auditService = new FakeAuditService();
  const reserveUseCase = new ReserveStockUseCase(
    stockReservationRepository,
    stockRepository,
    new StockTransactionNumberGenerator(stockRepository),
    auditService,
  );
  const releaseUseCase = new ReleaseStockReservationUseCase(
    stockReservationRepository,
    stockRepository,
    new StockTransactionNumberGenerator(stockRepository),
    auditService,
  );
  return { stockRepository, reserveUseCase, releaseUseCase };
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

describe('Stock Reservation lifecycle (task-125-126, UC-WHS-007)', () => {
  it('rejects reserving more than available stock', async () => {
    const { stockRepository, reserveUseCase } = buildSut();
    await seedStock(stockRepository, 'wh-1', 'item-1', 5);

    await expect(
      reserveUseCase.execute({
        warehouseId: 'wh-1',
        itemId: 'item-1',
        quantity: 10,
        referenceType: 'TREATMENT_PLAN',
        referenceId: 'tp-1',
        actorUserId: 'staff-1',
      }),
    ).rejects.toBeInstanceOf(StockInsufficientException);
  });

  it('reserves stock atomically -- currentStock unaffected, availableStock reduced', async () => {
    const { stockRepository, reserveUseCase } = buildSut();
    await seedStock(stockRepository, 'wh-1', 'item-1', 10);

    const reservation = await reserveUseCase.execute({
      warehouseId: 'wh-1',
      itemId: 'item-1',
      quantity: 4,
      referenceType: 'TREATMENT_PLAN',
      referenceId: 'tp-1',
      actorUserId: 'staff-1',
    });

    expect(reservation.status).toBe('ACTIVE');
    const stock = await stockRepository.findByWarehouseAndItem('wh-1', 'item-1');
    expect(Number(stock?.currentStock)).toBe(10);
    expect(Number(stock?.reservedStock)).toBe(4);
    expect(Number(stock?.availableStock)).toBe(6);
  });

  it('404s releasing a non-existent reservation', async () => {
    const { releaseUseCase } = buildSut();
    await expect(releaseUseCase.execute({ reservationId: 'missing', actorUserId: 'staff-1' })).rejects.toBeInstanceOf(
      StockReservationNotFoundException,
    );
  });

  it('releases a reservation, returning quantity to available stock', async () => {
    const { stockRepository, reserveUseCase, releaseUseCase } = buildSut();
    await seedStock(stockRepository, 'wh-1', 'item-1', 10);
    const reservation = await reserveUseCase.execute({
      warehouseId: 'wh-1',
      itemId: 'item-1',
      quantity: 4,
      referenceType: 'TREATMENT_PLAN',
      referenceId: 'tp-1',
      actorUserId: 'staff-1',
    });

    const released = await releaseUseCase.execute({ reservationId: reservation.id, actorUserId: 'staff-1' });
    expect(released.status).toBe('RELEASED');
    const stock = await stockRepository.findByWarehouseAndItem('wh-1', 'item-1');
    expect(Number(stock?.reservedStock)).toBe(0);
    expect(Number(stock?.availableStock)).toBe(10);
  });

  it('is idempotent: releasing an already-released reservation is a no-op', async () => {
    const { stockRepository, reserveUseCase, releaseUseCase } = buildSut();
    await seedStock(stockRepository, 'wh-1', 'item-1', 10);
    const reservation = await reserveUseCase.execute({
      warehouseId: 'wh-1',
      itemId: 'item-1',
      quantity: 4,
      referenceType: 'TREATMENT_PLAN',
      referenceId: 'tp-1',
      actorUserId: 'staff-1',
    });
    await releaseUseCase.execute({ reservationId: reservation.id, actorUserId: 'staff-1' });

    const secondRelease = await releaseUseCase.execute({ reservationId: reservation.id, actorUserId: 'staff-1' });
    expect(secondRelease.status).toBe('RELEASED');
    const stock = await stockRepository.findByWarehouseAndItem('wh-1', 'item-1');
    expect(Number(stock?.reservedStock)).toBe(0);
  });
});
