import { StockAdjustmentItem } from '@prisma/client';
import { StockAdjustmentWithItems } from '../../domain/repositories/IStockAdjustmentRepository';
import { StockAdjustmentItemResponseDto, StockAdjustmentResponseDto } from '../dtos/StockAdjustmentResponseDto';

function toItemDto(item: StockAdjustmentItem): StockAdjustmentItemResponseDto {
  return { id: item.id, itemId: item.itemId, quantity: Number(item.quantity) };
}

export function toStockAdjustmentResponseDto(adjustment: StockAdjustmentWithItems): StockAdjustmentResponseDto {
  return {
    id: adjustment.id,
    adjustmentNumber: adjustment.adjustmentNumber,
    warehouseId: adjustment.warehouseId,
    direction: adjustment.direction,
    reasonCode: adjustment.reasonCode,
    status: adjustment.status,
    items: adjustment.items.map(toItemDto),
    approvedBy: adjustment.approvedBy,
    approvedAt: adjustment.approvedAt ? adjustment.approvedAt.toISOString() : null,
    postedBy: adjustment.postedBy,
    postedAt: adjustment.postedAt ? adjustment.postedAt.toISOString() : null,
    createdAt: adjustment.createdAt.toISOString(),
    createdBy: adjustment.createdBy,
  };
}
