import { StockTransaction, WarehouseStock } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface StockListFilter {
  itemId?: string;
  warehouseId?: string;
}

export interface IStockRepository {
  list(query: ListQueryDto, filter: StockListFilter): Promise<PagedResult<WarehouseStock>>;
  findById(id: string): Promise<WarehouseStock | null>;
  findLedgerByWarehouseAndItem(warehouseId: string, itemId: string): Promise<StockTransaction[]>;
}
