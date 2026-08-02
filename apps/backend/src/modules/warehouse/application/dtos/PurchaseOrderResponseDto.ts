export interface PurchaseOrderItemResponseDto {
  id: string;
  itemId: string;
  quantityOrdered: number;
  unitPrice: number;
  subtotal: number;
  quantityReceived: number;
}

export interface PurchaseOrderResponseDto {
  id: string;
  purchaseOrderNumber: string;
  supplierId: string;
  branchId: string;
  warehouseId: string;
  orderDate: string;
  expectedDate: string | null;
  status: string;
  totalAmount: number;
  items: PurchaseOrderItemResponseDto[];
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  createdBy: string | null;
}
