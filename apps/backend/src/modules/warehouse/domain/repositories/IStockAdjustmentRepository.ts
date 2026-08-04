import { StockAdjustment, StockAdjustmentDirection, StockAdjustmentItem, StockAdjustmentStatus } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export type StockAdjustmentWithItems = StockAdjustment & { items: StockAdjustmentItem[] };

export interface CreateStockAdjustmentItemInput {
  itemId: string;
  quantity: number;
}

export interface CreateStockAdjustmentInput {
  adjustmentNumber: string;
  warehouseId: string;
  direction: StockAdjustmentDirection;
  reasonCode: string;
  items: CreateStockAdjustmentItemInput[];
  createdBy: string;
}

export interface StockAdjustmentListFilter {
  warehouseId?: string;
  direction?: StockAdjustmentDirection;
  status?: StockAdjustmentStatus;
}

export interface IStockAdjustmentRepository {
  create(input: CreateStockAdjustmentInput): Promise<StockAdjustmentWithItems>;
  list(query: ListQueryDto, filter: StockAdjustmentListFilter): Promise<PagedResult<StockAdjustmentWithItems>>;
  findById(id: string): Promise<StockAdjustmentWithItems | null>;
  updateStatus(
    id: string,
    status: StockAdjustmentStatus,
    fields: { approvedBy?: string; approvedAt?: Date; postedBy?: string; postedAt?: Date },
  ): Promise<StockAdjustmentWithItems>;
  count(): Promise<number>;
  findByNumber(adjustmentNumber: string): Promise<StockAdjustment | null>;
}
