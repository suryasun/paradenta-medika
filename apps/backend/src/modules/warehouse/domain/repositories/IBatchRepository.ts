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
}
