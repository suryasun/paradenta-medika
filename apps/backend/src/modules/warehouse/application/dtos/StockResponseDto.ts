export type StockStatus = 'OK' | 'LOW_STOCK';

export interface StockResponseDto {
  id: string;
  warehouseId: string;
  itemId: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minimumStock: number;
  status: StockStatus;
  lastTransactionAt: string | null;
}

export interface StockLedgerEntryResponseDto {
  id: string;
  transactionNumber: string;
  transactionType: string;
  referenceType: string;
  referenceId: string;
  qtyIn: number;
  qtyOut: number;
  balance: number;
  transactionDate: string;
  performedBy: string;
  approvedBy: string | null;
  notes: string | null;
}
