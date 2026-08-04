import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import {
  Batch,
  GoodsReceipt,
  GoodsReceiptItemEntry,
  Item,
  PurchaseOrder,
  PurchaseOrderItemEntry,
  PurchasesReportRow,
  Stock,
  StockAdjustment,
  StockAdjustmentDirection,
  StockAdjustmentItemEntry,
  StockLedgerEntry,
  StockOpname,
  StockReservation,
  StockTransfer,
  StockTransferItemEntry,
  SubmitStockOpnameItemEntry,
  Supplier,
  WarehouseLocation,
} from "../types/warehouse.types";

async function list<T>(path: string, params: Record<string, unknown> = {}): Promise<{ items: T[]; meta: PaginationMeta }> {
  const response = await apiClient.get<ApiSuccessBody<T[]>>(path, { params: { limit: 100, ...params } });
  return { items: response.data.data, meta: response.data.meta! };
}

async function detail<T>(path: string): Promise<T> {
  const response = await apiClient.get<ApiSuccessBody<T>>(path);
  return response.data.data;
}

async function post<T>(path: string, payload?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.post<ApiSuccessBody<T>>(path, payload);
  return response.data.data;
}

export const itemService = {
  list: (params?: Record<string, unknown>) => list<Item>("/warehouse/items", params),
  detail: (id: string) => detail<Item>(`/warehouse/items/${id}`),
  create: (payload: Record<string, unknown>) => post<Item>("/warehouse/items", payload),
  update: async (id: string, payload: Record<string, unknown>) => {
    const response = await apiClient.patch<ApiSuccessBody<Item>>(`/warehouse/items/${id}`, payload);
    return response.data.data;
  },
};

export const supplierService = {
  list: (params?: Record<string, unknown>) => list<Supplier>("/warehouse/suppliers", params),
  create: (payload: Record<string, unknown>) => post<Supplier>("/warehouse/suppliers", payload),
  update: async (id: string, payload: Record<string, unknown>) => {
    const response = await apiClient.patch<ApiSuccessBody<Supplier>>(`/warehouse/suppliers/${id}`, payload);
    return response.data.data;
  },
};

export const warehouseLocationService = {
  list: (params?: Record<string, unknown>) => list<WarehouseLocation>("/warehouse/warehouses", params),
  create: (payload: Record<string, unknown>) => post<WarehouseLocation>("/warehouse/warehouses", payload),
  update: async (id: string, payload: Record<string, unknown>) => {
    const response = await apiClient.patch<ApiSuccessBody<WarehouseLocation>>(`/warehouse/warehouses/${id}`, payload);
    return response.data.data;
  },
};

export const stockService = {
  list: (params?: Record<string, unknown>) => list<Stock>("/warehouse/stocks", params),
  ledger: (stockId: string, params?: Record<string, unknown>) => list<StockLedgerEntry>(`/warehouse/stocks/${stockId}/ledger`, params),
  createReservation: (payload: { warehouseId: string; itemId: string; quantity: number; referenceType: string; referenceId: string }) =>
    post<StockReservation>("/warehouse/reservations", payload),
  releaseReservation: (reservationId: string) => post<StockReservation>(`/warehouse/reservations/${reservationId}/release`),
};

export const purchaseOrderService = {
  list: (params?: Record<string, unknown>) => list<PurchaseOrder>("/warehouse/purchase-orders", params),
  detail: (id: string) => detail<PurchaseOrder>(`/warehouse/purchase-orders/${id}`),
  create: (payload: { supplierId: string; warehouseId: string; expectedDate?: string; items: PurchaseOrderItemEntry[] }) =>
    post<PurchaseOrder>("/warehouse/purchase-orders", payload),
  update: async (id: string, payload: Record<string, unknown>) => {
    const response = await apiClient.patch<ApiSuccessBody<PurchaseOrder>>(`/warehouse/purchase-orders/${id}`, payload);
    return response.data.data;
  },
  submit: (id: string) => post<PurchaseOrder>(`/warehouse/purchase-orders/${id}/submit`),
  approve: (id: string) => post<PurchaseOrder>(`/warehouse/purchase-orders/${id}/approve`),
  reject: (id: string, reason: string) => post<PurchaseOrder>(`/warehouse/purchase-orders/${id}/reject`, { reason }),
  cancel: (id: string, reason?: string) => post<PurchaseOrder>(`/warehouse/purchase-orders/${id}/cancel`, { reason }),
};

export const goodsReceiptService = {
  detail: (id: string) => detail<GoodsReceipt>(`/warehouse/goods-receipts/${id}`),
  create: (payload: { purchaseOrderId: string; warehouseId: string; receiptDate: string; supplierDocumentNo?: string; items: GoodsReceiptItemEntry[] }) =>
    post<GoodsReceipt>("/warehouse/goods-receipts", payload),
  postReceipt: (id: string) => post<GoodsReceipt>(`/warehouse/goods-receipts/${id}/post`),
};

export const stockTransferService = {
  list: (params?: Record<string, unknown>) => list<StockTransfer>("/warehouse/transfers", params),
  detail: (id: string) => detail<StockTransfer>(`/warehouse/transfers/${id}`),
  create: (payload: { sourceWarehouseId: string; destinationWarehouseId: string; notes?: string; items: StockTransferItemEntry[] }) =>
    post<StockTransfer>("/warehouse/transfers", payload),
  submit: (id: string) => post<StockTransfer>(`/warehouse/transfers/${id}/submit`),
  approve: (id: string) => post<StockTransfer>(`/warehouse/transfers/${id}/approve`),
  dispatch: (id: string) => post<StockTransfer>(`/warehouse/transfers/${id}/dispatch`),
  receive: (id: string) => post<StockTransfer>(`/warehouse/transfers/${id}/receive`),
};

export const stockAdjustmentService = {
  list: (params?: Record<string, unknown>) => list<StockAdjustment>("/warehouse/adjustments", params),
  detail: (id: string) => detail<StockAdjustment>(`/warehouse/adjustments/${id}`),
  create: (payload: { warehouseId: string; direction: StockAdjustmentDirection; reasonCode: string; items: StockAdjustmentItemEntry[] }) =>
    post<StockAdjustment>("/warehouse/adjustments", payload),
  approve: (id: string) => post<StockAdjustment>(`/warehouse/adjustments/${id}/approve`),
  postAdjustment: (id: string) => post<StockAdjustment>(`/warehouse/adjustments/${id}/post`),
};

export const stockOpnameService = {
  list: (params?: Record<string, unknown>) => list<StockOpname>("/warehouse/stock-opnames", params),
  detail: (id: string) => detail<StockOpname>(`/warehouse/stock-opnames/${id}`),
  create: (payload: { warehouseId: string; opnameDate: string; notes?: string; items: string[] }) =>
    post<StockOpname>("/warehouse/stock-opnames", payload),
  startCount: (id: string) => post<StockOpname>(`/warehouse/stock-opnames/${id}/start-count`),
  submitCount: (id: string, items: SubmitStockOpnameItemEntry[]) => post<StockOpname>(`/warehouse/stock-opnames/${id}/submit`, { items }),
  approve: (id: string) => post<StockOpname>(`/warehouse/stock-opnames/${id}/approve`),
  postOpname: (id: string) => post<StockOpname>(`/warehouse/stock-opnames/${id}/post`),
};

export const batchService = {
  list: (params?: Record<string, unknown>) => list<Batch>("/warehouse/batches", params),
  quarantine: (id: string) => post<Batch>(`/warehouse/batches/${id}/quarantine`),
};

export const warehouseReportsService = {
  stockCard: (params: Record<string, unknown>) => list<StockLedgerEntry>("/warehouse/reports/stock-card", params),
  stockBalance: (params?: Record<string, unknown>) => list<Stock>("/warehouse/reports/stock-balance", params),
  movements: (params?: Record<string, unknown>) => list<StockLedgerEntry>("/warehouse/reports/movements", params),
  purchases: (params?: Record<string, unknown>) => list<PurchasesReportRow>("/warehouse/reports/purchases", params),
  expiry: (params?: Record<string, unknown>) => list<Batch>("/warehouse/reports/expiry", params),
  opnames: (params?: Record<string, unknown>) => list<StockOpname>("/warehouse/reports/opnames", params),
};
