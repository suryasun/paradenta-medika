import { StockOpnameItem } from '@prisma/client';
import { StockOpnameWithItems } from '../../domain/repositories/IStockOpnameRepository';
import { StockOpnameItemResponseDto, StockOpnameResponseDto } from '../dtos/StockOpnameResponseDto';

function toItemDto(item: StockOpnameItem): StockOpnameItemResponseDto {
  return {
    id: item.id,
    itemId: item.itemId,
    systemQuantity: item.systemQuantity === null ? null : Number(item.systemQuantity),
    physicalQuantity: item.physicalQuantity === null ? null : Number(item.physicalQuantity),
    variance: item.variance === null ? null : Number(item.variance),
    notes: item.notes,
  };
}

export function toStockOpnameResponseDto(opname: StockOpnameWithItems): StockOpnameResponseDto {
  return {
    id: opname.id,
    opnameNumber: opname.opnameNumber,
    warehouseId: opname.warehouseId,
    opnameDate: opname.opnameDate.toISOString(),
    status: opname.status,
    notes: opname.notes,
    snapshotAt: opname.snapshotAt ? opname.snapshotAt.toISOString() : null,
    items: opname.items.map(toItemDto),
    submittedAt: opname.submittedAt ? opname.submittedAt.toISOString() : null,
    approvedBy: opname.approvedBy,
    approvedAt: opname.approvedAt ? opname.approvedAt.toISOString() : null,
    postedBy: opname.postedBy,
    postedAt: opname.postedAt ? opname.postedAt.toISOString() : null,
    createdAt: opname.createdAt.toISOString(),
    createdBy: opname.createdBy,
  };
}
