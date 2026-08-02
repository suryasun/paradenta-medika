import { StockOpname, StockOpnameItem, StockOpnameStatus } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export type StockOpnameWithItems = StockOpname & { items: StockOpnameItem[] };

export interface CreateStockOpnameInput {
  opnameNumber: string;
  warehouseId: string;
  opnameDate: Date;
  notes?: string;
  itemIds: string[];
  createdBy: string;
}

export interface ReplaceStockOpnameScopeInput {
  notes?: string;
  itemIds?: string[];
  updatedBy: string;
}

export interface StockOpnameListFilter {
  warehouseId?: string;
  status?: StockOpnameStatus;
}

export interface SubmitStockOpnameLineInput {
  itemId: string;
  physicalQuantity: number;
  notes?: string;
}

export interface IStockOpnameRepository {
  create(input: CreateStockOpnameInput): Promise<StockOpnameWithItems>;
  list(query: ListQueryDto, filter: StockOpnameListFilter): Promise<PagedResult<StockOpnameWithItems>>;
  findById(id: string): Promise<StockOpnameWithItems | null>;
  /** Returns the opname for (warehouseId, opnameDate) whose status is NOT `POSTED`/`REJECTED`, or null if none is active. */
  findActive(warehouseId: string, opnameDate: Date): Promise<StockOpname | null>;
  replaceScope(id: string, input: ReplaceStockOpnameScopeInput): Promise<StockOpnameWithItems>;
  startCount(id: string, systemQuantities: Map<string, number>, snapshotAt: Date): Promise<StockOpnameWithItems>;
  submit(id: string, lines: SubmitStockOpnameLineInput[], submittedAt: Date): Promise<StockOpnameWithItems>;
  updateStatus(
    id: string,
    status: StockOpnameStatus,
    fields: { approvedBy?: string; approvedAt?: Date; postedBy?: string; postedAt?: Date },
  ): Promise<StockOpnameWithItems>;
  count(): Promise<number>;
  findByNumber(opnameNumber: string): Promise<StockOpname | null>;
}
