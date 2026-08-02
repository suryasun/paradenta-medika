export interface StockAdjustmentItemResponseDto {
  id: string;
  itemId: string;
  quantity: number;
}

export interface StockAdjustmentResponseDto {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  direction: string;
  reasonCode: string;
  status: string;
  items: StockAdjustmentItemResponseDto[];
  approvedBy: string | null;
  approvedAt: string | null;
  postedBy: string | null;
  postedAt: string | null;
  createdAt: string;
  createdBy: string | null;
}
