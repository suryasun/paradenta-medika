export interface StockOpnameItemResponseDto {
  id: string;
  itemId: string;
  systemQuantity: number | null;
  physicalQuantity: number | null;
  variance: number | null;
  notes: string | null;
}

export interface StockOpnameResponseDto {
  id: string;
  opnameNumber: string;
  warehouseId: string;
  opnameDate: string;
  status: string;
  notes: string | null;
  snapshotAt: string | null;
  items: StockOpnameItemResponseDto[];
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  postedBy: string | null;
  postedAt: string | null;
  createdAt: string;
  createdBy: string | null;
}
