import { StockTransferItem } from '@prisma/client';
import { StockTransferWithItems } from '../../domain/repositories/IStockTransferRepository';
import { StockTransferItemResponseDto, StockTransferResponseDto } from '../dtos/StockTransferResponseDto';

function toItemDto(item: StockTransferItem): StockTransferItemResponseDto {
  return { id: item.id, itemId: item.itemId, quantity: Number(item.quantity) };
}

export function toStockTransferResponseDto(transfer: StockTransferWithItems): StockTransferResponseDto {
  return {
    id: transfer.id,
    transferNumber: transfer.transferNumber,
    sourceWarehouseId: transfer.sourceWarehouseId,
    destinationWarehouseId: transfer.destinationWarehouseId,
    status: transfer.status,
    notes: transfer.notes,
    items: transfer.items.map(toItemDto),
    submittedAt: transfer.submittedAt ? transfer.submittedAt.toISOString() : null,
    approvedBy: transfer.approvedBy,
    approvedAt: transfer.approvedAt ? transfer.approvedAt.toISOString() : null,
    dispatchedBy: transfer.dispatchedBy,
    dispatchedAt: transfer.dispatchedAt ? transfer.dispatchedAt.toISOString() : null,
    receivedBy: transfer.receivedBy,
    receivedAt: transfer.receivedAt ? transfer.receivedAt.toISOString() : null,
    createdAt: transfer.createdAt.toISOString(),
    createdBy: transfer.createdBy,
  };
}
