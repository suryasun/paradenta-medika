import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export type PurchaseOrderWithItems = PurchaseOrder & { items: PurchaseOrderItem[] };

export interface CreatePurchaseOrderItemInput {
  itemId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreatePurchaseOrderInput {
  purchaseOrderNumber: string;
  supplierId: string;
  branchId: string;
  warehouseId: string;
  expectedDate?: Date;
  items: CreatePurchaseOrderItemInput[];
  createdBy: string;
}

export interface ReplacePurchaseOrderItemsInput {
  warehouseId?: string;
  expectedDate?: Date;
  items?: CreatePurchaseOrderItemInput[];
  updatedBy: string;
}

export interface PurchaseOrderListFilter {
  status?: PurchaseOrderStatus;
  supplierId?: string;
  warehouseId?: string;
}

export interface IPurchaseOrderRepository {
  create(input: CreatePurchaseOrderInput): Promise<PurchaseOrderWithItems>;
  list(query: ListQueryDto, filter: PurchaseOrderListFilter): Promise<PagedResult<PurchaseOrderWithItems>>;
  findById(id: string): Promise<PurchaseOrderWithItems | null>;
  findByNumber(purchaseOrderNumber: string): Promise<PurchaseOrder | null>;
  replaceItems(id: string, input: ReplacePurchaseOrderItemsInput): Promise<PurchaseOrderWithItems>;
  updateStatus(
    id: string,
    status: PurchaseOrderStatus,
    fields: {
      submittedAt?: Date;
      approvedBy?: string;
      approvedAt?: Date;
      rejectedBy?: string;
      rejectedAt?: Date;
      rejectionReason?: string;
      cancelledBy?: string;
      cancelledAt?: Date;
      cancelReason?: string;
    },
  ): Promise<PurchaseOrderWithItems>;
  incrementReceivedQuantity(purchaseOrderItemId: string, quantity: number): Promise<void>;
  hasPostedGoodsReceipts(purchaseOrderId: string): Promise<boolean>;
  count(): Promise<number>;
  /** docs/06-tasks/task-225.md: purchase orders not yet in a terminal status (RECEIVED/CANCELLED/REJECTED), for the Branch Deactivation Guard. */
  countOpenByBranch(branchId: string): Promise<number>;
}
