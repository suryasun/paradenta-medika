import { StockTransaction, WarehouseStock } from '@prisma/client';
import { StockLedgerEntryResponseDto, StockResponseDto, StockStatus } from '../dtos/StockResponseDto';

/** docs/03-sad/18-module-warehouse.md Section 10.3: low-stock is based on available_stock, not current_stock. */
export function toStockResponseDto(stock: WarehouseStock, itemMinimumStock: number): StockResponseDto {
  const minimumStock = stock.minimumStock !== null ? Number(stock.minimumStock) : itemMinimumStock;
  const availableStock = Number(stock.availableStock);
  const status: StockStatus = availableStock <= minimumStock ? 'LOW_STOCK' : 'OK';

  return {
    id: stock.id,
    warehouseId: stock.warehouseId,
    itemId: stock.itemId,
    currentStock: Number(stock.currentStock),
    reservedStock: Number(stock.reservedStock),
    availableStock,
    minimumStock,
    status,
    lastTransactionAt: stock.lastTransactionAt ? stock.lastTransactionAt.toISOString() : null,
  };
}

export function toStockLedgerEntryResponseDto(transaction: StockTransaction): StockLedgerEntryResponseDto {
  return {
    id: transaction.id,
    warehouseId: transaction.warehouseId,
    itemId: transaction.itemId,
    batchId: transaction.batchId,
    transactionNumber: transaction.transactionNumber,
    transactionType: transaction.transactionType,
    referenceType: transaction.referenceType,
    referenceId: transaction.referenceId,
    qtyIn: Number(transaction.qtyIn),
    qtyOut: Number(transaction.qtyOut),
    balance: Number(transaction.balance),
    transactionDate: transaction.transactionDate.toISOString(),
    performedBy: transaction.performedBy,
    approvedBy: transaction.approvedBy,
    notes: transaction.notes,
  };
}
