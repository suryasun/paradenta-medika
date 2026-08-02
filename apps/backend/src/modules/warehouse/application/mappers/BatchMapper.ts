import { ItemBatch } from '@prisma/client';
import { BatchResponseDto } from '../dtos/BatchResponseDto';

export function toBatchResponseDto(batch: ItemBatch): BatchResponseDto {
  return {
    id: batch.id,
    warehouseId: batch.warehouseId,
    itemId: batch.itemId,
    batchNumber: batch.batchNumber,
    receivedDate: batch.receivedDate.toISOString(),
    expiryDate: batch.expiryDate ? batch.expiryDate.toISOString() : null,
    initialQuantity: Number(batch.initialQuantity),
    remainingQuantity: Number(batch.remainingQuantity),
    status: batch.status,
    quarantinedBy: batch.quarantinedBy,
    quarantinedAt: batch.quarantinedAt ? batch.quarantinedAt.toISOString() : null,
    createdAt: batch.createdAt.toISOString(),
  };
}
