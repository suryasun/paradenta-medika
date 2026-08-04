import { GoodsReceipt, GoodsReceiptItem } from '@prisma/client';

export type GoodsReceiptWithItems = GoodsReceipt & { items: GoodsReceiptItem[] };

export interface CreateGoodsReceiptItemInput {
  purchaseOrderItemId: string;
  itemId: string;
  quantity: number;
  unitCost: number;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface CreateGoodsReceiptInput {
  goodsReceiptNumber: string;
  purchaseOrderId: string;
  warehouseId: string;
  receiptDate: Date;
  supplierDocumentNo?: string;
  items: CreateGoodsReceiptItemInput[];
  createdBy: string;
}

export interface IGoodsReceiptRepository {
  create(input: CreateGoodsReceiptInput): Promise<GoodsReceiptWithItems>;
  findById(id: string): Promise<GoodsReceiptWithItems | null>;
  findByNumber(goodsReceiptNumber: string): Promise<GoodsReceipt | null>;
  markPosted(id: string, postedBy: string, postedAt: Date): Promise<GoodsReceiptWithItems>;
  count(): Promise<number>;
  /** docs/06-tasks/task-225.md: unposted (DRAFT) goods receipts for a branch's warehouse locations, for the Branch Deactivation Guard. */
  countOpenByBranch(branchId: string): Promise<number>;
}
