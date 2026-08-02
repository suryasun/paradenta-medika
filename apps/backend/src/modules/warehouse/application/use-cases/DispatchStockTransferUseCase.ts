import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  StockInsufficientException,
  StockTransferNotFoundException,
  StockTransferNotInStatusException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IStockTransferRepository } from '../../domain/repositories/IStockTransferRepository';
import { IStockRepository } from '../../domain/repositories/IStockRepository';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { StockTransferResponseDto } from '../dtos/StockTransferResponseDto';
import { toStockTransferResponseDto } from '../mappers/StockTransferMapper';

export interface DispatchStockTransferInput {
  transferId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-119.md; docs/03-sad/18-module-warehouse.md UC-WHS-004: removes source warehouse stock on dispatch. */
export class DispatchStockTransferUseCase {
  constructor(
    private readonly stockTransferRepository: IStockTransferRepository,
    private readonly stockRepository: IStockRepository,
    private readonly numberGenerator: StockTransactionNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: DispatchStockTransferInput): Promise<StockTransferResponseDto> {
    const existing = await this.stockTransferRepository.findById(input.transferId);
    if (!existing) {
      throw new StockTransferNotFoundException();
    }
    if (existing.status !== 'APPROVED') {
      throw new StockTransferNotInStatusException('approved');
    }

    for (const line of existing.items) {
      const stock = await this.stockRepository.findByWarehouseAndItem(existing.sourceWarehouseId, line.itemId);
      const available = stock ? Number(stock.availableStock) : 0;
      if (available < Number(line.quantity)) {
        throw new StockInsufficientException();
      }
    }

    const now = new Date();
    for (const line of existing.items) {
      const transactionNumber = await this.numberGenerator.generate(now);
      await this.stockRepository.applyStockMovement({
        transactionNumber,
        warehouseId: existing.sourceWarehouseId,
        itemId: line.itemId,
        transactionType: 'TRANSFER',
        referenceType: 'STOCK_TRANSFER',
        referenceId: existing.id,
        qtyOut: Number(line.quantity),
        transactionDate: now,
        performedBy: input.actorUserId,
      });
    }

    const updated = await this.stockTransferRepository.updateStatus(input.transferId, 'DISPATCHED', {
      dispatchedBy: input.actorUserId,
      dispatchedAt: now,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockTransfer',
      input.transferId,
      'UPDATE',
      { status: 'APPROVED' },
      { status: 'DISPATCHED', lineCount: existing.items.length },
      auditContext,
    );

    return toStockTransferResponseDto(updated);
  }
}
