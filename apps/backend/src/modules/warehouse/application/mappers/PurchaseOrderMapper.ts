import { PurchaseOrderItem } from '@prisma/client';
import { PurchaseOrderWithItems } from '../../domain/repositories/IPurchaseOrderRepository';
import { PurchaseOrderItemResponseDto, PurchaseOrderResponseDto } from '../dtos/PurchaseOrderResponseDto';

function toItemDto(item: PurchaseOrderItem): PurchaseOrderItemResponseDto {
  return {
    id: item.id,
    itemId: item.itemId,
    quantityOrdered: Number(item.quantityOrdered),
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.subtotal),
    quantityReceived: Number(item.quantityReceived),
  };
}

export function toPurchaseOrderResponseDto(po: PurchaseOrderWithItems): PurchaseOrderResponseDto {
  return {
    id: po.id,
    purchaseOrderNumber: po.purchaseOrderNumber,
    supplierId: po.supplierId,
    branchId: po.branchId,
    warehouseId: po.warehouseId,
    orderDate: po.orderDate.toISOString(),
    expectedDate: po.expectedDate ? po.expectedDate.toISOString() : null,
    status: po.status,
    totalAmount: Number(po.totalAmount),
    items: po.items.map(toItemDto),
    submittedAt: po.submittedAt ? po.submittedAt.toISOString() : null,
    approvedBy: po.approvedBy,
    approvedAt: po.approvedAt ? po.approvedAt.toISOString() : null,
    rejectedBy: po.rejectedBy,
    rejectedAt: po.rejectedAt ? po.rejectedAt.toISOString() : null,
    rejectionReason: po.rejectionReason,
    cancelledBy: po.cancelledBy,
    cancelledAt: po.cancelledAt ? po.cancelledAt.toISOString() : null,
    cancelReason: po.cancelReason,
    createdAt: po.createdAt.toISOString(),
    createdBy: po.createdBy,
  };
}
