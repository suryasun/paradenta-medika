export interface GoodsReceiptItemResponseDto {
  id: string;
  purchaseOrderItemId: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  batchNumber: string | null;
  expiryDate: string | null;
}

export interface GoodsReceiptResponseDto {
  id: string;
  goodsReceiptNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  receiptDate: string;
  supplierDocumentNo: string | null;
  status: string;
  postedBy: string | null;
  postedAt: string | null;
  items: GoodsReceiptItemResponseDto[];
  createdAt: string;
  createdBy: string | null;
}
