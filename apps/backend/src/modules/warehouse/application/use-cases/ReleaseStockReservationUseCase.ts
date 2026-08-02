import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { StockReservationNotFoundException } from '../../domain/exceptions/WarehouseExceptions';
import { IStockReservationRepository } from '../../domain/repositories/IStockReservationRepository';
import { IStockRepository } from '../../domain/repositories/IStockRepository';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { StockReservationResponseDto } from '../dtos/StockReservationResponseDto';
import { toStockReservationResponseDto } from '../mappers/StockReservationMapper';

export interface ReleaseStockReservationInput {
  reservationId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-126.md AC: "Idempotent (releasing an already-released reservation is a no-op, not an error)." */
export class ReleaseStockReservationUseCase {
  constructor(
    private readonly stockReservationRepository: IStockReservationRepository,
    private readonly stockRepository: IStockRepository,
    private readonly numberGenerator: StockTransactionNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ReleaseStockReservationInput): Promise<StockReservationResponseDto> {
    const existing = await this.stockReservationRepository.findById(input.reservationId);
    if (!existing) {
      throw new StockReservationNotFoundException();
    }
    if (existing.status === 'RELEASED') {
      return toStockReservationResponseDto(existing);
    }

    const now = new Date();
    const transactionNumber = await this.numberGenerator.generate(now);
    await this.stockRepository.applyReservation({
      transactionNumber,
      warehouseId: existing.warehouseId,
      itemId: existing.itemId,
      quantity: Number(existing.quantity),
      release: true,
      referenceType: existing.referenceType,
      referenceId: existing.referenceId,
      transactionDate: now,
      performedBy: input.actorUserId,
    });

    const released = await this.stockReservationRepository.markReleased(input.reservationId, input.actorUserId, now);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockReservation',
      input.reservationId,
      'UPDATE',
      { status: 'ACTIVE' },
      { status: 'RELEASED' },
      auditContext,
    );

    return toStockReservationResponseDto(released);
  }
}
