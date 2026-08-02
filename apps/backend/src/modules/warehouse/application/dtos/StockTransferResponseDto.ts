export interface StockTransferItemResponseDto {
  id: string;
  itemId: string;
  quantity: number;
}

export interface StockTransferResponseDto {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: string;
  notes: string | null;
  items: StockTransferItemResponseDto[];
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  dispatchedBy: string | null;
  dispatchedAt: string | null;
  receivedBy: string | null;
  receivedAt: string | null;
  createdAt: string;
  createdBy: string | null;
}
