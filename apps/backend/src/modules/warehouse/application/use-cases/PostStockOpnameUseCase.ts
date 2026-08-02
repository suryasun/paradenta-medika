import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  NegativeStockForbiddenException,
  StockOpnameAlreadyPostedException,
  StockOpnameNotFoundException,
  StockOpnameNotInStatusException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IStockOpnameRepository } from '../../domain/repositories/IStockOpnameRepository';
import { IStockRepository } from '../../domain/repositories/IStockRepository';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { StockOpnameResponseDto } from '../dtos/StockOpnameResponseDto';
import { toStockOpnameResponseDto } from '../mappers/StockOpnameMapper';

export interface PostStockOpnameInput {
  opnameId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export interface StockOpnamePostedEventPayload {
  opnameId: string;
  opnameNumber: string;
  warehouseId: string;
  postedBy: string;
  postedAt: string;
}

/**
 * docs/06-tasks/task-133.md; docs/03-sad/18-module-warehouse.md UC-WHS-006
 * step 5. Writes one `OPNAME` stock transaction per non-zero-variance
 * line (qtyIn for a positive variance/surplus, qtyOut for a negative
 * variance/shortage), rejects a shortage that would drive current stock
 * negative (`WHS_NEGATIVE_STOCK_FORBIDDEN`), and is idempotent on the
 * opname's own `status` (reposting an already-`POSTED` opname returns
 * `WHS_DUPLICATE_MOVEMENT`, the same pattern as Goods Receipt/Adjustment).
 *
 * Fires the SAD's literal `warehouse.stock-opname-approved.v1` event
 * (docs/03-sad/18-module-warehouse.md Section 7 consumer table) at this
 * Post step rather than at Approve -- the SAD's own UC-WHS-006 narrative
 * (step 5) conflates approval and ledger-posting into one action ("Approval
 * menghasilkan transaksi OPNAME... sekali"), but task-132/task-133 split
 * them into two distinct endpoints per this task set's literal API table;
 * the event is fired where the ledger write actually happens, keeping the
 * SAD's literal event name.
 */
export class PostStockOpnameUseCase {
  constructor(
    private readonly stockOpnameRepository: IStockOpnameRepository,
    private readonly stockRepository: IStockRepository,
    private readonly numberGenerator: StockTransactionNumberGenerator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: PostStockOpnameInput): Promise<StockOpnameResponseDto> {
    const existing = await this.stockOpnameRepository.findById(input.opnameId);
    if (!existing) {
      throw new StockOpnameNotFoundException();
    }
    if (existing.status === 'POSTED') {
      throw new StockOpnameAlreadyPostedException();
    }
    if (existing.status !== 'APPROVED') {
      throw new StockOpnameNotInStatusException('APPROVED');
    }

    const variantLines = existing.items.filter((line) => line.variance !== null && Number(line.variance) !== 0);

    for (const line of variantLines) {
      const variance = Number(line.variance);
      if (variance < 0) {
        const stock = await this.stockRepository.findByWarehouseAndItem(existing.warehouseId, line.itemId);
        const currentStock = stock ? Number(stock.currentStock) : 0;
        if (currentStock + variance < 0) {
          throw new NegativeStockForbiddenException();
        }
      }
    }

    const now = new Date();
    for (const line of variantLines) {
      const variance = Number(line.variance);
      const transactionNumber = await this.numberGenerator.generate(now);
      await this.stockRepository.applyStockMovement({
        transactionNumber,
        warehouseId: existing.warehouseId,
        itemId: line.itemId,
        transactionType: 'OPNAME',
        referenceType: 'STOCK_OPNAME',
        referenceId: existing.id,
        qtyIn: variance > 0 ? variance : undefined,
        qtyOut: variance < 0 ? Math.abs(variance) : undefined,
        transactionDate: now,
        performedBy: input.actorUserId,
        approvedBy: existing.approvedBy ?? undefined,
        notes: line.notes ?? existing.notes ?? undefined,
      });
    }

    const posted = await this.stockOpnameRepository.updateStatus(input.opnameId, 'POSTED', {
      postedBy: input.actorUserId,
      postedAt: now,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'StockOpname',
      input.opnameId,
      'UPDATE',
      { status: 'APPROVED' },
      { status: 'POSTED', variantLineCount: variantLines.length },
      auditContext,
    );

    const eventPayload: StockOpnamePostedEventPayload = {
      opnameId: posted.id,
      opnameNumber: posted.opnameNumber,
      warehouseId: posted.warehouseId,
      postedBy: input.actorUserId,
      postedAt: now.toISOString(),
    };
    await this.eventBus.publish('warehouse.stock-opname-approved.v1', eventPayload);

    return toStockOpnameResponseDto(posted);
  }
}
