import { ItemBatch, ItemBatchStatus } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface UpsertBatchReceiptInput {
  warehouseId: string;
  itemId: string;
  batchNumber: string;
  receivedDate: Date;
  expiryDate?: Date | null;
  quantity: number;
  createdBy: string;
}

export interface BatchListFilter {
  itemId?: string;
  warehouseId?: string;
  status?: ItemBatchStatus;
  expiryFrom?: Date;
  expiryTo?: Date;
}

export interface IBatchRepository {
  /** Finds the existing batch by (warehouseId, itemId, batchNumber) and increments it, or creates a new one. */
  upsertReceipt(input: UpsertBatchReceiptInput): Promise<ItemBatch>;
  findById(id: string): Promise<ItemBatch | null>;
  list(query: ListQueryDto, filter: BatchListFilter): Promise<PagedResult<ItemBatch>>;
  markQuarantined(id: string, quarantinedBy: string, quarantinedAt: Date): Promise<ItemBatch>;
  /**
   * docs/06-tasks/task-136.md; UC-WHS-003 step 2 (FEFO). All `ACTIVE`
   * batches for this warehouse/item regardless of expiry -- the caller
   * (ConsumeMaterialUseCase) separates expired-vs-valid and sorts by
   * expiryDate ascending itself, since FEFO's "no-expiry-tracked items sort
   * last" rule isn't expressible as a plain Prisma orderBy without a raw
   * query.
   */
  findActiveByWarehouseAndItem(warehouseId: string, itemId: string): Promise<ItemBatch[]>;
  /** Decrements `remainingQuantity`; transitions the batch to `DEPLETED` once it reaches zero. */
  decrementRemaining(id: string, quantity: number): Promise<ItemBatch>;
}
