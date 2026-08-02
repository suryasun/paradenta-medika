import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  AdjustmentApprovalRequiredException,
  NegativeStockForbiddenException,
  StockAdjustmentAlreadyPostedException,
  StockAdjustmentNotFoundException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IStockAdjustmentRepository } from '../../domain/repositories/IStockAdjustmentRepository';
import { IStockRepository } from '../../domain/repositories/IStockRepository';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { StockAdjustmentResponseDto } from '../dtos/StockAdjustmentResponseDto';
import { toStockAdjustmentResponseDto } from '../mappers/StockAdjustmentMapper';

export interface PostStockAdjustmentInput {
  adjustmentId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export interface StockAdjustmentPostedEventPayload {
  adjustmentId: string;
  adjustmentNumber: string;
  warehouseId: string;
  direction: string;
  postedBy: string;
  postedAt: string;
}

/**
 * docs/06-tasks/task-124.md; docs/03-sad/18-module-warehouse.md UC-WHS-005.
 * The transaction boundary: rejects if not `approved`
 * (`WHS_ADJUSTMENT_APPROVAL_REQUIRED`), rejects an OUT adjustment that
 * would drive current stock negative (`WHS_NEGATIVE_STOCK_FORBIDDEN`), and
 * is idempotent on the adjustment's own `status` (reposting an already-
 * `POSTED` adjustment returns `WHS_DUPLICATE_MOVEMENT`, the same pattern
 * as PostGoodsReceiptUseCase).
 */
export class PostStockAdjustmentUseCase {
  constructor(
    private readonly stockAdjustmentRepository: IStockAdjustmentRepository,
    private readonly stockRepository: IStockRepository,
    private readonly numberGenerator: StockTransactionNumberGenerator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: PostStockAdjustmentInput): Promise<StockAdjustmentResponseDto> {
    const existing = await this.stockAdjustmentRepository.findById(input.adjustmentId);
    if (!existing) {
      throw new StockAdjustmentNotFoundException();
    }
    if (existing.status === 'POSTED') {
      throw new StockAdjustmentAlreadyPostedException();
    }
    if (existing.status !== 'APPROVED') {
      throw new AdjustmentApprovalRequiredException();
    }

    if (existing.direction === 'OUT') {
      for (const line of existing.items) {
        const stock = await this.stockRepository.findByWarehouseAndItem(existing.warehouseId, line.itemId);
        const currentStock = stock ? Number(stock.currentStock) : 0;
        if (currentStock - Number(line.quantity) < 0) {
          throw new NegativeStockForbiddenException();
        }
      }
    }

    const now = new Date();
    for (const line of existing.items) {
      const transactionNumber = await this.numberGenerator.generate(now);
      await this.stockRepository.applyStockMovement({
        transactionNumber,
        warehouseId: existing.warehouseId,
        itemId: line.itemId,
        transactionType: 'ADJUSTMENT',
        referenceType: 'STOCK_ADJUSTMENT',
        referenceId: existing.id,
        qtyIn: existing.direction === 'IN' ? Number(line.quantity) : undefined,
        qtyOut: existing.direction === 'OUT' ? Number(line.quantity) : undefined,
        transactionDate: now,
        performedBy: input.actorUserId,
        approvedBy: existing.approvedBy ?? undefined,
        notes: existing.reasonCode,
      });
    }

    const posted = await this.stockAdjustmentRepository.updateStatus(input.adjustmentId, 'POSTED', {
      postedBy: input.actorUserId,
      postedAt: now,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockAdjustment',
      input.adjustmentId,
      'UPDATE',
      { status: 'APPROVED' },
      { status: 'POSTED', lineCount: existing.items.length },
      auditContext,
    );

    const eventPayload: StockAdjustmentPostedEventPayload = {
      adjustmentId: posted.id,
      adjustmentNumber: posted.adjustmentNumber,
      warehouseId: posted.warehouseId,
      direction: posted.direction,
      postedBy: input.actorUserId,
      postedAt: now.toISOString(),
    };
    await this.eventBus.publish('warehouse.stock-adjusted.v1', eventPayload);

    return toStockAdjustmentResponseDto(posted);
  }
}
