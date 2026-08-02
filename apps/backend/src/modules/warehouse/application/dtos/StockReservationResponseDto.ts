export interface StockReservationResponseDto {
  id: string;
  warehouseId: string;
  itemId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  status: string;
  releasedBy: string | null;
  releasedAt: string | null;
  createdAt: string;
  createdBy: string | null;
}
