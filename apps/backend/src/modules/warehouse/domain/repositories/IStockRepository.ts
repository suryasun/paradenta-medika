import { StockTransaction, WarehouseStock, WarehouseStockTransactionType } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface StockListFilter {
  itemId?: string;
  warehouseId?: string;
}

/**
 * docs/03-sad/18-module-warehouse.md Section 3.5 "Aturan Saldo dan
 * Concurrency": every stock mutation locks the balance row inside a
 * transaction, computes `current_stock +/- qty`, and writes exactly one
 * ledger row atomically with the balance update. This single primitive
 * implements that rule once; Epic W's Post Goods Receipt uses it with
 * `qtyIn` only, and it is reused (not reimplemented) by later epics
 * (Transfer, Adjustment, Opname, EMR material consumption) that need the
 * same qtyIn/qtyOut posting shape.
 */
export interface ApplyStockMovementInput {
  transactionNumber: string;
  warehouseId: string;
  itemId: string;
  batchId?: string | null;
  transactionType: WarehouseStockTransactionType;
  referenceType: string;
  referenceId: string;
  qtyIn?: number;
  qtyOut?: number;
  transactionDate: Date;
  performedBy: string;
  approvedBy?: string;
  notes?: string;
}

export interface IStockRepository {
  list(query: ListQueryDto, filter: StockListFilter): Promise<PagedResult<WarehouseStock>>;
  findById(id: string): Promise<WarehouseStock | null>;
  findLedgerByWarehouseAndItem(warehouseId: string, itemId: string): Promise<StockTransaction[]>;
  findByTransactionNumber(transactionNumber: string): Promise<StockTransaction | null>;
  countTransactions(): Promise<number>;
  applyStockMovement(input: ApplyStockMovementInput): Promise<StockTransaction>;
}
