import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import {
  BatchRequiredException,
  ItemNotFoundException,
  PurchaseOrderNotApprovedException,
  PurchaseOrderNotFoundException,
  ReceiptOverQuantityException,
} from '../../domain/exceptions/WarehouseExceptions';
import { IPurchaseOrderRepository } from '../../domain/repositories/IPurchaseOrderRepository';
import { IGoodsReceiptRepository } from '../../domain/repositories/IGoodsReceiptRepository';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { GoodsReceiptNumberGenerator } from '../services/GoodsReceiptNumberGenerator';
import { GoodsReceiptItemEntryDto } from '../dtos/GoodsReceiptRequestDto';
import { GoodsReceiptResponseDto } from '../dtos/GoodsReceiptResponseDto';
import { toGoodsReceiptResponseDto } from '../mappers/GoodsReceiptMapper';

export interface CreateGoodsReceiptInput {
  purchaseOrderId: string;
  warehouseId: string;
  receiptDate: string;
  supplierDocumentNo?: string;
  items: GoodsReceiptItemEntryDto[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

const RECEIVABLE_STATUSES = ['APPROVED', 'PARTIALLY_RECEIVED'];

/**
 * docs/06-tasks/task-112.md; docs/03-sad/18-module-warehouse.md UC-WHS-002
 * steps 1-3. Only records what was physically received (`draft`/unposted);
 * stock is not affected until task-114 (PostGoodsReceiptUseCase).
 */
export class CreateGoodsReceiptUseCase {
  constructor(
    private readonly purchaseOrderRepository: IPurchaseOrderRepository,
    private readonly goodsReceiptRepository: IGoodsReceiptRepository,
    private readonly itemRepository: IItemRepository,
    private readonly numberGenerator: GoodsReceiptNumberGenerator,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateGoodsReceiptInput): Promise<GoodsReceiptResponseDto> {
    const po = await this.purchaseOrderRepository.findById(input.purchaseOrderId);
    if (!po) {
      throw new PurchaseOrderNotFoundException();
    }
    if (!RECEIVABLE_STATUSES.includes(po.status)) {
      throw new PurchaseOrderNotApprovedException();
    }

    for (const line of input.items) {
      const poItem = po.items.find((i) => i.id === line.purchaseOrderItemId);
      if (!poItem) {
        throw new PurchaseOrderNotFoundException();
      }
      if (Number(poItem.quantityReceived) + line.quantity > Number(poItem.quantityOrdered)) {
        throw new ReceiptOverQuantityException();
      }

      const item = await this.itemRepository.findById(line.itemId);
      if (!item) {
        throw new ItemNotFoundException();
      }
      if (item.isBatchTracked && !line.batchNumber) {
        throw new BatchRequiredException();
      }
      if (item.isExpiryTracked && !line.expiryDate) {
        throw new BatchRequiredException();
      }
    }

    const now = new Date();
    const goodsReceiptNumber = await this.numberGenerator.generate(now);

    const receipt = await this.goodsReceiptRepository.create({
      goodsReceiptNumber,
      purchaseOrderId: input.purchaseOrderId,
      warehouseId: input.warehouseId,
      receiptDate: new Date(input.receiptDate),
      supplierDocumentNo: input.supplierDocumentNo,
      items: input.items.map((line) => ({
        purchaseOrderItemId: line.purchaseOrderItemId,
        itemId: line.itemId,
        quantity: line.quantity,
        unitCost: line.unitCost,
        batchNumber: line.batchNumber,
        expiryDate: line.expiryDate ? new Date(line.expiryDate) : undefined,
      })),
      createdBy: input.actorUserId,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'GoodsReceipt',
      receipt.id,
      'CREATE',
      null,
      { goodsReceiptNumber, purchaseOrderId: input.purchaseOrderId, itemCount: input.items.length },
      auditContext,
    );

    return toGoodsReceiptResponseDto(receipt);
  }
}
