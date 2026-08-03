// Mirrors apps/backend/src/modules/warehouse's actual DTOs/Prisma enums
// (verified against the real route/DTO files, not docs/02-design prose --
// see docs/02-design/pages/warehouse.md's own "backend-grounded" note).

export interface Item {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  unitId: string;
  minimumStock: number;
  purchasePrice: number | null;
  sellingPrice: number | null;
  isConsumable: boolean;
  isBatchTracked: boolean;
  isExpiryTracked: boolean;
  isActive: boolean;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  picName: string | null;
  phone: string | null;
  address: string | null;
  taxNumber: string | null;
  isActive: boolean;
}

export interface WarehouseLocation {
  id: string;
  branchId: string;
  code: string;
  name: string;
  locationType: string | null;
  address: string | null;
  managerUserId: string | null;
  isActive: boolean;
}

export type StockStatus = "OK" | "LOW_STOCK";

export interface Stock {
  id: string;
  warehouseId: string;
  itemId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number | null;
  status: StockStatus;
  lastTransactionAt: string | null;
}

export type StockTransactionType =
  | "PURCHASE"
  | "SALE"
  | "TREATMENT"
  | "ADJUSTMENT"
  | "TRANSFER"
  | "OPNAME"
  | "RETURN"
  | "RESERVATION"
  | "RELEASE_RESERVATION";

export interface StockLedgerEntry {
  id: string;
  warehouseId: string;
  itemId: string;
  batchId: string | null;
  transactionNumber: string;
  transactionType: StockTransactionType;
  referenceType: string;
  referenceId: string;
  qtyIn: number;
  qtyOut: number;
  balance: number;
  transactionDate: string;
  performedBy: string;
  approvedBy: string | null;
  notes: string | null;
}

export type PurchaseOrderStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELLED" | "PARTIALLY_RECEIVED" | "RECEIVED";

export interface PurchaseOrderItemEntry {
  itemId: string;
  quantity: number;
  unitPrice: number;
}

export interface PurchaseOrderItem {
  id: string;
  itemId: string;
  quantityOrdered: number;
  unitPrice: number;
  subtotal: number;
  quantityReceived: number;
}

export interface PurchaseOrder {
  id: string;
  purchaseOrderNumber: string;
  supplierId: string;
  branchId: string;
  warehouseId: string;
  orderDate: string;
  expectedDate: string | null;
  status: PurchaseOrderStatus;
  totalAmount: number;
  items: PurchaseOrderItem[];
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
  createdBy: string;
}

export type GoodsReceiptStatus = "DRAFT" | "POSTED";

export interface GoodsReceiptItemEntry {
  purchaseOrderItemId: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface GoodsReceiptItem {
  id: string;
  purchaseOrderItemId: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  batchNumber: string | null;
  expiryDate: string | null;
}

export interface GoodsReceipt {
  id: string;
  goodsReceiptNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  receiptDate: string;
  supplierDocumentNo: string | null;
  status: GoodsReceiptStatus;
  postedBy: string | null;
  postedAt: string | null;
  items: GoodsReceiptItem[];
  createdAt: string;
  createdBy: string;
}

export type StockTransferStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "DISPATCHED" | "RECEIVED";

export interface StockTransferItemEntry {
  itemId: string;
  quantity: number;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  status: StockTransferStatus;
  notes: string | null;
  items: Array<{ id: string; itemId: string; quantity: number }>;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  dispatchedBy: string | null;
  dispatchedAt: string | null;
  receivedBy: string | null;
  receivedAt: string | null;
  createdAt: string;
  createdBy: string;
}

export type StockAdjustmentDirection = "IN" | "OUT";
export type StockAdjustmentStatus = "DRAFT" | "APPROVED" | "POSTED";

export interface StockAdjustmentItemEntry {
  itemId: string;
  quantity: number;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  direction: StockAdjustmentDirection;
  reasonCode: string;
  status: StockAdjustmentStatus;
  items: Array<{ id: string; itemId: string; quantity: number }>;
  approvedBy: string | null;
  approvedAt: string | null;
  postedBy: string | null;
  postedAt: string | null;
  createdAt: string;
  createdBy: string;
}

export type StockReservationStatus = "ACTIVE" | "RELEASED";

export interface StockReservation {
  id: string;
  warehouseId: string;
  itemId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  status: StockReservationStatus;
  releasedBy: string | null;
  releasedAt: string | null;
  createdAt: string;
  createdBy: string;
}

export type StockOpnameStatus = "DRAFT" | "COUNTING" | "SUBMITTED" | "APPROVED" | "POSTED" | "REJECTED";

export interface StockOpnameItem {
  id: string;
  itemId: string;
  systemQuantity: number | null;
  physicalQuantity: number | null;
  variance: number | null;
  notes: string | null;
}

export interface StockOpname {
  id: string;
  opnameNumber: string;
  warehouseId: string;
  opnameDate: string;
  status: StockOpnameStatus;
  notes: string | null;
  snapshotAt: string | null;
  items: StockOpnameItem[];
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  postedBy: string | null;
  postedAt: string | null;
  createdAt: string;
  createdBy: string;
}

export interface SubmitStockOpnameItemEntry {
  itemId: string;
  physicalQuantity: number;
  notes?: string;
}

export type ItemBatchStatus = "ACTIVE" | "QUARANTINED" | "EXPIRED" | "DEPLETED";

export interface Batch {
  id: string;
  warehouseId: string;
  itemId: string;
  batchNumber: string;
  receivedDate: string;
  expiryDate: string | null;
  initialQuantity: number;
  remainingQuantity: number;
  status: ItemBatchStatus;
  quarantinedBy: string | null;
  quarantinedAt: string | null;
  createdAt: string;
}

export interface PurchasesReportRow {
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  warehouseId: string;
  orderDate: string;
  expectedDate: string | null;
  status: PurchaseOrderStatus;
  totalAmount: number;
  orderedQuantity: number;
  receivedQuantity: number;
  receiptCount: number;
  firstReceiptPostedAt: string | null;
  leadTimeDays: number | null;
}
