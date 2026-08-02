import { Item } from '@prisma/client';
import { ItemResponseDto } from '../dtos/ItemResponseDto';

export function toItemResponseDto(item: Item): ItemResponseDto {
  return {
    id: item.id,
    code: item.itemCode,
    name: item.itemName,
    categoryId: item.categoryId,
    unitId: item.unitId,
    minimumStock: Number(item.minimumStock),
    purchasePrice: Number(item.purchasePrice),
    sellingPrice: Number(item.sellingPrice),
    isConsumable: item.isConsumable,
    isBatchTracked: item.isBatchTracked,
    isExpiryTracked: item.isExpiryTracked,
    isActive: item.isActive,
    createdAt: item.createdAt.toISOString(),
    createdBy: item.createdBy,
    updatedAt: item.updatedAt.toISOString(),
    updatedBy: item.updatedBy,
  };
}
