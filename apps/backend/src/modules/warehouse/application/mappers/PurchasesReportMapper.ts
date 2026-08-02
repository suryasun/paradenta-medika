import { PurchasesReportRow } from '../../domain/repositories/IWarehouseReportRepository';
import { PurchasesReportRowResponseDto } from '../dtos/PurchasesReportResponseDto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toPurchasesReportRowResponseDto(row: PurchasesReportRow): PurchasesReportRowResponseDto {
  const leadTimeDays = row.firstReceiptPostedAt
    ? Math.round((row.firstReceiptPostedAt.getTime() - row.orderDate.getTime()) / MS_PER_DAY)
    : null;

  return {
    purchaseOrderId: row.purchaseOrderId,
    purchaseOrderNumber: row.purchaseOrderNumber,
    supplierId: row.supplierId,
    warehouseId: row.warehouseId,
    orderDate: row.orderDate.toISOString(),
    expectedDate: row.expectedDate ? row.expectedDate.toISOString() : null,
    status: row.status,
    totalAmount: row.totalAmount,
    orderedQuantity: row.orderedQuantity,
    receivedQuantity: row.receivedQuantity,
    receiptCount: row.receiptCount,
    firstReceiptPostedAt: row.firstReceiptPostedAt ? row.firstReceiptPostedAt.toISOString() : null,
    leadTimeDays,
  };
}
