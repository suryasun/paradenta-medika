import { StockTransfer, StockTransferItem, StockTransferStatus } from '@prisma/client';

export type StockTransferWithItems = StockTransfer & { items: StockTransferItem[] };

export interface CreateStockTransferItemInput {
  itemId: string;
  quantity: number;
}

export interface CreateStockTransferInput {
  transferNumber: string;
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  notes?: string;
  items: CreateStockTransferItemInput[];
  createdBy: string;
}

export interface IStockTransferRepository {
  create(input: CreateStockTransferInput): Promise<StockTransferWithItems>;
  findById(id: string): Promise<StockTransferWithItems | null>;
  updateStatus(
    id: string,
    status: StockTransferStatus,
    fields: {
      submittedAt?: Date;
      approvedBy?: string;
      approvedAt?: Date;
      dispatchedBy?: string;
      dispatchedAt?: Date;
      receivedBy?: string;
      receivedAt?: Date;
    },
  ): Promise<StockTransferWithItems>;
  count(): Promise<number>;
  findByNumber(transferNumber: string): Promise<StockTransfer | null>;
}
