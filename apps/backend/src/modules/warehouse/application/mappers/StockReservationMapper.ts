import { StockReservation } from '@prisma/client';
import { StockReservationResponseDto } from '../dtos/StockReservationResponseDto';

export function toStockReservationResponseDto(reservation: StockReservation): StockReservationResponseDto {
  return {
    id: reservation.id,
    warehouseId: reservation.warehouseId,
    itemId: reservation.itemId,
    quantity: Number(reservation.quantity),
    referenceType: reservation.referenceType,
    referenceId: reservation.referenceId,
    status: reservation.status,
    releasedBy: reservation.releasedBy,
    releasedAt: reservation.releasedAt ? reservation.releasedAt.toISOString() : null,
    createdAt: reservation.createdAt.toISOString(),
    createdBy: reservation.createdBy,
  };
}
