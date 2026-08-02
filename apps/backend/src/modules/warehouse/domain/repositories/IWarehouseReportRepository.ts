import { PurchaseOrderStatus, StockTransaction, WarehouseStockTransactionType } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface StockCardFilter {
  warehouseId: string;
  itemId: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface MovementsFilter {
  warehouseId?: string;
  itemId?: string;
  transactionType?: WarehouseStockTransactionType;
  referenceType?: string;
  performedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface PurchasesReportRow {
  purchaseOrderId: string;
  purchaseOrderNumber: string;
  supplierId: string;
  warehouseId: string;
  orderDate: Date;
  expectedDate: Date | null;
  status: PurchaseOrderStatus;
  totalAmount: number;
  orderedQuantity: number;
  receivedQuantity: number;
  receiptCount: number;
  firstReceiptPostedAt: Date | null;
}

export interface PurchasesReportFilter {
  warehouseId?: string;
  supplierId?: string;
  status?: PurchaseOrderStatus;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * docs/03-sad/18-module-warehouse.md Section 6.5 Reports: read-only,
 * cross-entity report queries that don't fit any single resource
 * repository's responsibility -- Stock Balance/Expiry/Opnames reports
 * reuse the existing IStockRepository/IBatchRepository/
 * IStockOpnameRepository `.list()` methods directly (their shapes
 * already match Section 10.2's literal field lists), so only the three
 * reports needing genuinely new query shapes (date-ranged ledger,
 * type/actor-filtered movements, PO+receipt aggregation) live here.
 */
export interface IWarehouseReportRepository {
  getStockCard(filter: StockCardFilter, query: ListQueryDto): Promise<PagedResult<StockTransaction>>;
  getMovements(filter: MovementsFilter, query: ListQueryDto): Promise<PagedResult<StockTransaction>>;
  getPurchasesReport(filter: PurchasesReportFilter, query: ListQueryDto): Promise<PagedResult<PurchasesReportRow>>;
}
