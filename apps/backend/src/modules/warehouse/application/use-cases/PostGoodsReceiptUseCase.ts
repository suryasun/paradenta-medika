import { IEventBus } from '../../../../shared/events/EventBus';
import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  GoodsReceiptAlreadyPostedException,
  GoodsReceiptNotFoundException,
  PurchaseOrderNotFoundException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IBatchRepository } from '../../domain/repositories/IBatchRepository';
import { IGoodsReceiptRepository } from '../../domain/repositories/IGoodsReceiptRepository';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { IPurchaseOrderRepository } from '../../domain/repositories/IPurchaseOrderRepository';
import { IStockRepository } from '../../domain/repositories/IStockRepository';
import { StockTransactionNumberGenerator } from '../services/StockTransactionNumberGenerator';
import { GoodsReceiptResponseDto } from '../dtos/GoodsReceiptResponseDto';
import { toGoodsReceiptResponseDto } from '../mappers/GoodsReceiptMapper';

export interface PostGoodsReceiptInput {
  goodsReceiptId: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export interface GoodsReceiptPostedEventPayload {
  goodsReceiptId: string;
  goodsReceiptNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  postedBy: string;
  postedAt: string;
}

/**
 * docs/06-tasks/task-114.md; docs/03-sad/18-module-warehouse.md UC-WHS-002
 * step 4-5. The transaction boundary that finalizes Receive Goods: writes
 * one `StockTransaction` ledger row per line (via `IStockRepository.
 * applyStockMovement`, the shared posting primitive built in Epic V/W),
 * increments `PurchaseOrderItem.quantityReceived`, and transitions the PO
 * to PARTIALLY_RECEIVED or RECEIVED depending on whether every line is now
 * fully received. Idempotent on the receipt's own `status` field --
 * reposting an already-`POSTED` receipt is rejected before any mutation.
 *
 * docs/06-tasks/task-134.md ("Creates warehouse_batches table (populated
 * by Goods Receipt task-114 when isBatchTracked)"): for each line whose
 * item `isBatchTracked`, upserts an `ItemBatch` row from the receipt
 * line's `batchNumber`/`expiryDate` (validated non-null by
 * CreateGoodsReceiptUseCase's own `BatchRequiredException` check) and
 * links the resulting batch onto the `StockTransaction.batchId`.
 */
export class PostGoodsReceiptUseCase {
  constructor(
    private readonly goodsReceiptRepository: IGoodsReceiptRepository,
    private readonly purchaseOrderRepository: IPurchaseOrderRepository,
    private readonly stockRepository: IStockRepository,
    private readonly itemRepository: IItemRepository,
    private readonly batchRepository: IBatchRepository,
    private readonly numberGenerator: StockTransactionNumberGenerator,
    private readonly auditService: IAuditService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: PostGoodsReceiptInput): Promise<GoodsReceiptResponseDto> {
    const receipt = await this.goodsReceiptRepository.findById(input.goodsReceiptId);
    if (!receipt) {
      throw new GoodsReceiptNotFoundException();
    }
    if (receipt.status === 'POSTED') {
      throw new GoodsReceiptAlreadyPostedException();
    }

    const po = await this.purchaseOrderRepository.findById(receipt.purchaseOrderId);
    if (!po) {
      throw new PurchaseOrderNotFoundException();
    }

    const receivedByPoItemId = new Map<string, number>();
    for (const line of receipt.items) {
      let batchId: string | undefined;
      const item = await this.itemRepository.findById(line.itemId);
      if (item?.isBatchTracked && line.batchNumber) {
        const batch = await this.batchRepository.upsertReceipt({
          warehouseId: receipt.warehouseId,
          itemId: line.itemId,
          batchNumber: line.batchNumber,
          receivedDate: receipt.receiptDate,
          expiryDate: line.expiryDate,
          quantity: Number(line.quantity),
          createdBy: input.actorUserId,
        });
        batchId = batch.id;
      }

      const transactionNumber = await this.numberGenerator.generate(receipt.receiptDate);
      await this.stockRepository.applyStockMovement({
        transactionNumber,
        warehouseId: receipt.warehouseId,
        itemId: line.itemId,
        batchId,
        transactionType: 'PURCHASE',
        referenceType: 'GOODS_RECEIPT',
        referenceId: receipt.id,
        qtyIn: Number(line.quantity),
        transactionDate: receipt.receiptDate,
        performedBy: input.actorUserId,
      });
      await this.purchaseOrderRepository.incrementReceivedQuantity(line.purchaseOrderItemId, Number(line.quantity));
      receivedByPoItemId.set(line.purchaseOrderItemId, Number(line.quantity));
    }

    const allFullyReceived = po.items.every((poItem) => {
      const additionalReceived = receivedByPoItemId.get(poItem.id) ?? 0;
      return Number(poItem.quantityReceived) + additionalReceived >= Number(poItem.quantityOrdered);
    });
    await this.purchaseOrderRepository.updateStatus(po.id, allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED', {});

    const postedAt = new Date();
    const posted = await this.goodsReceiptRepository.markPosted(receipt.id, input.actorUserId, postedAt);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'GoodsReceipt',
      receipt.id,
      'UPDATE',
      { status: 'DRAFT' },
      { status: 'POSTED', lineCount: receipt.items.length },
      auditContext,
    );

    const eventPayload: GoodsReceiptPostedEventPayload = {
      goodsReceiptId: posted.id,
      goodsReceiptNumber: posted.goodsReceiptNumber,
      purchaseOrderId: posted.purchaseOrderId,
      warehouseId: posted.warehouseId,
      postedBy: input.actorUserId,
      postedAt: postedAt.toISOString(),
    };
    await this.eventBus.publish('warehouse.goods-receipt.posted.v1', eventPayload);

    return toGoodsReceiptResponseDto(posted);
  }
}
