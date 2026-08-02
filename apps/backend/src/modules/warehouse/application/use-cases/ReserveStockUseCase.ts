import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { StockInsufficientException } from '../../domain/exceptions/WarehouseExceptions';
import { IStockReservationRepository } from '../../domain/repositories/IStockReservationRepository';
import { IStockRepository } from '../../domain/repositories/IStockRepository';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { StockReservationResponseDto } from '../dtos/StockReservationResponseDto';
import { toStockReservationResponseDto } from '../mappers/StockReservationMapper';

export interface ReserveStockInput {
  warehouseId: string;
  itemId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-125.md; docs/03-sad/18-module-warehouse.md UC-WHS-007: increments reservedStock/decrements availableStock without touching currentStock. */
export class ReserveStockUseCase {
  constructor(
    private readonly stockReservationRepository: IStockReservationRepository,
    private readonly stockRepository: IStockRepository,
    private readonly numberGenerator: StockTransactionNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ReserveStockInput): Promise<StockReservationResponseDto> {
    const stock = await this.stockRepository.findByWarehouseAndItem(input.warehouseId, input.itemId);
    const available = stock ? Number(stock.availableStock) : 0;
    if (available < input.quantity) {
      throw new StockInsufficientException();
    }

    const reservation = await this.stockReservationRepository.create({
      warehouseId: input.warehouseId,
      itemId: input.itemId,
      quantity: input.quantity,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      createdBy: input.actorUserId,
    });

    const now = new Date();
    const transactionNumber = await this.numberGenerator.generate(now);
    await this.stockRepository.applyReservation({
      transactionNumber,
      warehouseId: input.warehouseId,
      itemId: input.itemId,
      quantity: input.quantity,
      release: false,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      transactionDate: now,
      performedBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockReservation',
      reservation.id,
      'CREATE',
      null,
      { warehouseId: input.warehouseId, itemId: input.itemId, quantity: input.quantity },
      auditContext,
    );

    return toStockReservationResponseDto(reservation);
  }
}
