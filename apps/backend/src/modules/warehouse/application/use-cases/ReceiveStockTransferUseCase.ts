import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  StockTransferAlreadyReceivedException,
  StockTransferNotFoundException,
  StockTransferNotInStatusException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IStockTransferRepository } from '../../domain/repositories/IStockTransferRepository';
import { IStockRepository } from '../../domain/repositories/IStockRepository';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { StockTransferResponseDto } from '../dtos/StockTransferResponseDto';
import { toStockTransferResponseDto } from '../mappers/StockTransferMapper';

export interface ReceiveStockTransferInput {
  transferId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/** docs/06-tasks/task-120.md; docs/03-sad/18-module-warehouse.md UC-WHS-004: adds destination warehouse stock, completing the transfer. */
export class ReceiveStockTransferUseCase {
  constructor(
    private readonly stockTransferRepository: IStockTransferRepository,
    private readonly stockRepository: IStockRepository,
    private readonly numberGenerator: StockTransactionNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ReceiveStockTransferInput): Promise<StockTransferResponseDto> {
    const existing = await this.stockTransferRepository.findById(input.transferId);
    if (!existing) {
      throw new StockTransferNotFoundException();
    }
    if (existing.status === 'RECEIVED') {
      throw new StockTransferAlreadyReceivedException();
    }
    if (existing.status !== 'DISPATCHED') {
      throw new StockTransferNotInStatusException('dispatched');
    }

    const now = new Date();
    for (const line of existing.items) {
      const transactionNumber = await this.numberGenerator.generate(now);
      await this.stockRepository.applyStockMovement({
        transactionNumber,
        warehouseId: existing.destinationWarehouseId,
        itemId: line.itemId,
        transactionType: 'TRANSFER',
        referenceType: 'STOCK_TRANSFER',
        referenceId: existing.id,
        qtyIn: Number(line.quantity),
        transactionDate: now,
        performedBy: input.actorUserId,
      });
    }

    const updated = await this.stockTransferRepository.updateStatus(input.transferId, 'RECEIVED', {
      receivedBy: input.actorUserId,
      receivedAt: now,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockTransfer',
      input.transferId,
      'UPDATE',
      { status: 'DISPATCHED' },
      { status: 'RECEIVED', lineCount: existing.items.length },
      auditContext,
    );

    return toStockTransferResponseDto(updated);
  }
}
