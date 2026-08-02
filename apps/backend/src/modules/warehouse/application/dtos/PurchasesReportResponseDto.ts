export interface PurchasesReportRowResponseDto {
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  warehouseId: string;
  orderDate: string;
  expectedDate: string | null;
  status: string;
  totalAmount: number;
  orderedQuantity: number;
  receivedQuantity: number;
  receiptCount: number;
  firstReceiptPostedAt: string | null;
  leadTimeDays: number | null;
}
