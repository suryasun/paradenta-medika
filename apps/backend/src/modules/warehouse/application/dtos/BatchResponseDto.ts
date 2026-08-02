export interface BatchResponseDto {
  id: string;
  warehouseId: string;
  itemId: string;
  batchNumber: string;
  receivedDate: string;
  expiryDate: string | null;
  initialQuantity: number;
  remainingQuantity: number;
  status: string;
  quarantinedBy: string | null;
  quarantinedAt: string | null;
  createdAt: string;
}
