import { GoodsReceiptItem } from '@prisma/client';
import { GoodsReceiptWithItems } from '../../domain/repositories/IGoodsReceiptRepository';
import { GoodsReceiptItemResponseDto, GoodsReceiptResponseDto } from '../dtos/GoodsReceiptResponseDto';

function toItemDto(item: GoodsReceiptItem): GoodsReceiptItemResponseDto {
  return {
    id: item.id,
    purchaseOrderItemId: item.purchaseOrderItemId,
    itemId: item.itemId,
    quantity: Number(item.quantity),
    unitCost: Number(item.unitCost),
    batchNumber: item.batchNumber,
    expiryDate: item.expiryDate ? item.expiryDate.toISOString() : null,
  };
}

export function toGoodsReceiptResponseDto(gr: GoodsReceiptWithItems): GoodsReceiptResponseDto {
  return {
    id: gr.id,
    goodsReceiptNumber: gr.goodsReceiptNumber,
    purchaseOrderId: gr.purchaseOrderId,
    warehouseId: gr.warehouseId,
    receiptDate: gr.receiptDate.toISOString(),
    supplierDocumentNo: gr.supplierDocumentNo,
    status: gr.status,
    postedBy: gr.postedBy,
    postedAt: gr.postedAt ? gr.postedAt.toISOString() : null,
    items: gr.items.map(toItemDto),
    createdAt: gr.createdAt.toISOString(),
    createdBy: gr.createdBy,
  };
}
