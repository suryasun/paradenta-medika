import {
  GoodsReceipt,
  GoodsReceiptItem,
  Item,
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrderStatus,
  StockAdjustment,
  StockAdjustmentItem,
  StockAdjustmentStatus,
  StockReservation,
  StockTransaction,
  StockTransfer,
  StockTransferItem,
  StockTransferStatus,
  Supplier,
  WarehouseLocation,
  WarehouseStock,
} from '@prisma/client';
import { CreateItemInput, IItemRepository, UpdateItemInput } from '../../src/modules/warehouse/domain/repositories/IItemRepository';
import { CreateSupplierInput, ISupplierRepository } from '../../src/modules/warehouse/domain/repositories/ISupplierRepository';
import {
  CreateWarehouseLocationInput,
  IWarehouseLocationRepository,
} from '../../src/modules/warehouse/domain/repositories/IWarehouseLocationRepository';
import {
  ApplyReservationInput,
  ApplyStockMovementInput,
  IStockRepository,
  StockListFilter,
} from '../../src/modules/warehouse/domain/repositories/IStockRepository';
import {
  CreatePurchaseOrderInput,
  IPurchaseOrderRepository,
  PurchaseOrderListFilter,
  PurchaseOrderWithItems,
  ReplacePurchaseOrderItemsInput,
} from '../../src/modules/warehouse/domain/repositories/IPurchaseOrderRepository';
import {
  CreateGoodsReceiptInput,
  GoodsReceiptWithItems,
  IGoodsReceiptRepository,
} from '../../src/modules/warehouse/domain/repositories/IGoodsReceiptRepository';
import {
  CreateStockTransferInput,
  IStockTransferRepository,
  StockTransferWithItems,
} from '../../src/modules/warehouse/domain/repositories/IStockTransferRepository';
import {
  CreateStockAdjustmentInput,
  IStockAdjustmentRepository,
  StockAdjustmentWithItems,
} from '../../src/modules/warehouse/domain/repositories/IStockAdjustmentRepository';
import {
  CreateStockReservationInput,
  IStockReservationRepository,
} from '../../src/modules/warehouse/domain/repositories/IStockReservationRepository';
import { ListQueryDto } from '../../src/shared/http/ListQueryDto';
import { PagedResult } from '../../src/shared/http/pagination';
import { nextFakeUuid } from './uuid';

export class FakeItemRepository implements IItemRepository {
  items = new Map<string, Item>();
  ledgerItemIds = new Set<string>();

  async create(input: CreateItemInput): Promise<Item> {
    const item: Item = {
      id: nextFakeUuid(),
      itemCode: input.itemCode,
      itemName: input.itemName,
      categoryId: input.categoryId,
      unitId: input.unitId,
      minimumStock: input.minimumStock as never,
      purchasePrice: (input.purchasePrice ?? 0) as never,
      sellingPrice: (input.sellingPrice ?? 0) as never,
      isConsumable: input.isConsumable,
      isBatchTracked: input.isBatchTracked,
      isExpiryTracked: input.isExpiryTracked,
      isActive: true,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as Item;
    this.items.set(item.id, item);
    return item;
  }

  async list(query: ListQueryDto): Promise<PagedResult<Item>> {
    const all = [...this.items.values()].filter((i) => !i.deletedAt);
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<Item | null> {
    return this.items.get(id) ?? null;
  }

  async findByCode(itemCode: string): Promise<Item | null> {
    return [...this.items.values()].find((i) => i.itemCode === itemCode && !i.deletedAt) ?? null;
  }

  async update(id: string, input: UpdateItemInput): Promise<Item> {
    const item = this.items.get(id);
    if (!item) throw new Error('not found');
    if (input.itemName !== undefined) item.itemName = input.itemName;
    if (input.categoryId !== undefined) item.categoryId = input.categoryId;
    if (input.unitId !== undefined) item.unitId = input.unitId;
    if (input.minimumStock !== undefined) item.minimumStock = input.minimumStock as never;
    if (input.purchasePrice !== undefined) item.purchasePrice = input.purchasePrice as never;
    if (input.sellingPrice !== undefined) item.sellingPrice = input.sellingPrice as never;
    if (input.isConsumable !== undefined) item.isConsumable = input.isConsumable;
    if (input.isBatchTracked !== undefined) item.isBatchTracked = input.isBatchTracked;
    if (input.isExpiryTracked !== undefined) item.isExpiryTracked = input.isExpiryTracked;
    if (input.isActive !== undefined) item.isActive = input.isActive;
    item.updatedBy = input.updatedBy;
    item.updatedAt = new Date();
    return item;
  }

  async hasStockLedgerEntries(itemId: string): Promise<boolean> {
    return this.ledgerItemIds.has(itemId);
  }
}

export class FakeSupplierRepository implements ISupplierRepository {
  suppliers = new Map<string, Supplier>();

  async create(input: CreateSupplierInput): Promise<Supplier> {
    const supplier: Supplier = {
      id: nextFakeUuid(),
      supplierCode: input.supplierCode,
      supplierName: input.supplierName,
      picName: input.picName ?? null,
      phone: input.phone ?? null,
      address: input.address ?? null,
      taxNumber: input.taxNumber ?? null,
      isActive: true,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as Supplier;
    this.suppliers.set(supplier.id, supplier);
    return supplier;
  }

  async list(query: ListQueryDto): Promise<PagedResult<Supplier>> {
    const all = [...this.suppliers.values()].filter((s) => !s.deletedAt);
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<Supplier | null> {
    return this.suppliers.get(id) ?? null;
  }

  async findByCode(supplierCode: string): Promise<Supplier | null> {
    return [...this.suppliers.values()].find((s) => s.supplierCode === supplierCode && !s.deletedAt) ?? null;
  }
}

export class FakeWarehouseLocationRepository implements IWarehouseLocationRepository {
  locations = new Map<string, WarehouseLocation>();

  async create(input: CreateWarehouseLocationInput): Promise<WarehouseLocation> {
    const location: WarehouseLocation = {
      id: nextFakeUuid(),
      branchId: input.branchId,
      locationCode: input.locationCode,
      locationName: input.locationName,
      locationType: input.locationType ?? 'MAIN',
      address: input.address ?? null,
      managerUserId: input.managerUserId ?? null,
      isActive: true,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
    } as WarehouseLocation;
    this.locations.set(location.id, location);
    return location;
  }

  async list(query: ListQueryDto): Promise<PagedResult<WarehouseLocation>> {
    const all = [...this.locations.values()].filter((l) => !l.deletedAt);
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<WarehouseLocation | null> {
    return this.locations.get(id) ?? null;
  }

  async findByBranchAndCode(branchId: string, locationCode: string): Promise<WarehouseLocation | null> {
    return (
      [...this.locations.values()].find((l) => l.branchId === branchId && l.locationCode === locationCode && !l.deletedAt) ?? null
    );
  }
}

export class FakeStockRepository implements IStockRepository {
  stocks = new Map<string, WarehouseStock>();
  transactions: StockTransaction[] = [];

  async list(query: ListQueryDto, filter: StockListFilter): Promise<PagedResult<WarehouseStock>> {
    const all = [...this.stocks.values()].filter(
      (s) => (!filter.itemId || s.itemId === filter.itemId) && (!filter.warehouseId || s.warehouseId === filter.warehouseId),
    );
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<WarehouseStock | null> {
    return this.stocks.get(id) ?? null;
  }

  async findByWarehouseAndItem(warehouseId: string, itemId: string): Promise<WarehouseStock | null> {
    return [...this.stocks.values()].find((s) => s.warehouseId === warehouseId && s.itemId === itemId) ?? null;
  }

  async findLedgerByWarehouseAndItem(warehouseId: string, itemId: string): Promise<StockTransaction[]> {
    return this.transactions
      .filter((t) => t.warehouseId === warehouseId && t.itemId === itemId)
      .sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());
  }

  async findByTransactionNumber(transactionNumber: string): Promise<StockTransaction | null> {
    return this.transactions.find((t) => t.transactionNumber === transactionNumber) ?? null;
  }

  async countTransactions(): Promise<number> {
    return this.transactions.length;
  }

  async applyStockMovement(input: ApplyStockMovementInput): Promise<StockTransaction> {
    let stock = [...this.stocks.values()].find((s) => s.warehouseId === input.warehouseId && s.itemId === input.itemId);
    if (!stock) {
      stock = {
        id: nextFakeUuid(),
        warehouseId: input.warehouseId,
        itemId: input.itemId,
        currentStock: 0 as never,
        reservedStock: 0 as never,
        availableStock: 0 as never,
        minimumStock: null,
        version: 0,
        lastTransactionAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WarehouseStock;
      this.stocks.set(stock.id, stock);
    }

    const qtyIn = input.qtyIn ?? 0;
    const qtyOut = input.qtyOut ?? 0;
    const newCurrentStock = Number(stock.currentStock) + qtyIn - qtyOut;
    stock.currentStock = newCurrentStock as never;
    stock.availableStock = (newCurrentStock - Number(stock.reservedStock)) as never;
    stock.version += 1;
    stock.lastTransactionAt = input.transactionDate;

    const transaction: StockTransaction = {
      id: nextFakeUuid(),
      transactionNumber: input.transactionNumber,
      warehouseId: input.warehouseId,
      itemId: input.itemId,
      batchId: input.batchId ?? null,
      transactionType: input.transactionType,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      qtyIn: qtyIn as never,
      qtyOut: qtyOut as never,
      balance: newCurrentStock as never,
      transactionDate: input.transactionDate,
      performedBy: input.performedBy,
      approvedBy: input.approvedBy ?? null,
      notes: input.notes ?? null,
      createdAt: new Date(),
    } as StockTransaction;
    this.transactions.push(transaction);
    return transaction;
  }

  async applyReservation(input: ApplyReservationInput): Promise<StockTransaction> {
    let stock = [...this.stocks.values()].find((s) => s.warehouseId === input.warehouseId && s.itemId === input.itemId);
    if (!stock) {
      stock = {
        id: nextFakeUuid(),
        warehouseId: input.warehouseId,
        itemId: input.itemId,
        currentStock: 0 as never,
        reservedStock: 0 as never,
        availableStock: 0 as never,
        minimumStock: null,
        version: 0,
        lastTransactionAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WarehouseStock;
      this.stocks.set(stock.id, stock);
    }

    const delta = input.release ? -input.quantity : input.quantity;
    const newReservedStock = Math.max(0, Number(stock.reservedStock) + delta);
    stock.reservedStock = newReservedStock as never;
    stock.availableStock = (Number(stock.currentStock) - newReservedStock) as never;
    stock.version += 1;
    stock.lastTransactionAt = input.transactionDate;

    const transaction: StockTransaction = {
      id: nextFakeUuid(),
      transactionNumber: input.transactionNumber,
      warehouseId: input.warehouseId,
      itemId: input.itemId,
      batchId: null,
      transactionType: input.release ? 'RELEASE_RESERVATION' : 'RESERVATION',
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      qtyIn: (input.release ? input.quantity : 0) as never,
      qtyOut: (input.release ? 0 : input.quantity) as never,
      balance: stock.currentStock,
      transactionDate: input.transactionDate,
      performedBy: input.performedBy,
      approvedBy: null,
      notes: null,
      createdAt: new Date(),
    } as StockTransaction;
    this.transactions.push(transaction);
    return transaction;
  }
}

export class FakePurchaseOrderRepository implements IPurchaseOrderRepository {
  purchaseOrders = new Map<string, PurchaseOrderWithItems>();
  postedReceiptPurchaseOrderIds = new Set<string>();
  private itemSequence = 0;

  private computeSubtotal(quantity: number, unitPrice: number): number {
    return Math.round(quantity * unitPrice * 100) / 100;
  }

  async create(input: CreatePurchaseOrderInput): Promise<PurchaseOrderWithItems> {
    const po: PurchaseOrderWithItems = {
      id: nextFakeUuid(),
      purchaseOrderNumber: input.purchaseOrderNumber,
      supplierId: input.supplierId,
      branchId: input.branchId,
      warehouseId: input.warehouseId,
      orderDate: new Date(),
      expectedDate: input.expectedDate ?? null,
      status: 'DRAFT',
      totalAmount: input.items.reduce((sum, i) => sum + this.computeSubtotal(i.quantity, i.unitPrice), 0) as never,
      submittedAt: null,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      cancelledBy: null,
      cancelledAt: null,
      cancelReason: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
      items: input.items.map((item) => {
        this.itemSequence += 1;
        return {
          id: `poi-${this.itemSequence}-${nextFakeUuid()}`,
          purchaseOrderId: '',
          itemId: item.itemId,
          quantityOrdered: item.quantity as never,
          unitPrice: item.unitPrice as never,
          subtotal: this.computeSubtotal(item.quantity, item.unitPrice) as never,
          quantityReceived: 0 as never,
          createdAt: new Date(),
        } as PurchaseOrderItem;
      }),
    } as PurchaseOrderWithItems;
    po.items.forEach((item) => {
      (item as PurchaseOrderItem).purchaseOrderId = po.id;
    });
    this.purchaseOrders.set(po.id, po);
    return po;
  }

  async list(query: ListQueryDto, filter: PurchaseOrderListFilter): Promise<PagedResult<PurchaseOrderWithItems>> {
    const all = [...this.purchaseOrders.values()].filter(
      (po) =>
        (!filter.status || po.status === filter.status) &&
        (!filter.supplierId || po.supplierId === filter.supplierId) &&
        (!filter.warehouseId || po.warehouseId === filter.warehouseId),
    );
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<PurchaseOrderWithItems | null> {
    return this.purchaseOrders.get(id) ?? null;
  }

  async findByNumber(purchaseOrderNumber: string): Promise<PurchaseOrder | null> {
    return [...this.purchaseOrders.values()].find((po) => po.purchaseOrderNumber === purchaseOrderNumber) ?? null;
  }

  async replaceItems(id: string, input: ReplacePurchaseOrderItemsInput): Promise<PurchaseOrderWithItems> {
    const po = this.purchaseOrders.get(id);
    if (!po) throw new Error('not found');
    if (input.warehouseId !== undefined) po.warehouseId = input.warehouseId;
    if (input.expectedDate !== undefined) po.expectedDate = input.expectedDate;
    if (input.items) {
      po.items = input.items.map((item) => {
        this.itemSequence += 1;
        return {
          id: `poi-${this.itemSequence}-${nextFakeUuid()}`,
          purchaseOrderId: id,
          itemId: item.itemId,
          quantityOrdered: item.quantity as never,
          unitPrice: item.unitPrice as never,
          subtotal: this.computeSubtotal(item.quantity, item.unitPrice) as never,
          quantityReceived: 0 as never,
          createdAt: new Date(),
        } as PurchaseOrderItem;
      });
      po.totalAmount = input.items.reduce((sum, i) => sum + this.computeSubtotal(i.quantity, i.unitPrice), 0) as never;
    }
    po.updatedBy = input.updatedBy;
    po.updatedAt = new Date();
    return po;
  }

  async updateStatus(
    id: string,
    status: PurchaseOrderStatus,
    fields: Partial<{
      submittedAt: Date;
      approvedBy: string;
      approvedAt: Date;
      rejectedBy: string;
      rejectedAt: Date;
      rejectionReason: string;
      cancelledBy: string;
      cancelledAt: Date;
      cancelReason: string;
    }>,
  ): Promise<PurchaseOrderWithItems> {
    const po = this.purchaseOrders.get(id);
    if (!po) throw new Error('not found');
    po.status = status;
    Object.assign(po, fields);
    return po;
  }

  async incrementReceivedQuantity(purchaseOrderItemId: string, quantity: number): Promise<void> {
    for (const po of this.purchaseOrders.values()) {
      const item = po.items.find((i) => i.id === purchaseOrderItemId);
      if (item) {
        item.quantityReceived = (Number(item.quantityReceived) + quantity) as never;
        return;
      }
    }
  }

  async hasPostedGoodsReceipts(purchaseOrderId: string): Promise<boolean> {
    return this.postedReceiptPurchaseOrderIds.has(purchaseOrderId);
  }

  async count(): Promise<number> {
    return this.purchaseOrders.size;
  }
}

export class FakeGoodsReceiptRepository implements IGoodsReceiptRepository {
  receipts = new Map<string, GoodsReceiptWithItems>();
  private itemSequence = 0;

  async create(input: CreateGoodsReceiptInput): Promise<GoodsReceiptWithItems> {
    const receipt: GoodsReceiptWithItems = {
      id: nextFakeUuid(),
      goodsReceiptNumber: input.goodsReceiptNumber,
      purchaseOrderId: input.purchaseOrderId,
      warehouseId: input.warehouseId,
      receiptDate: input.receiptDate,
      supplierDocumentNo: input.supplierDocumentNo ?? null,
      status: 'DRAFT',
      postedBy: null,
      postedAt: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      items: input.items.map((item) => {
        this.itemSequence += 1;
        return {
          id: `gri-${this.itemSequence}-${nextFakeUuid()}`,
          goodsReceiptId: '',
          purchaseOrderItemId: item.purchaseOrderItemId,
          itemId: item.itemId,
          quantity: item.quantity as never,
          unitCost: item.unitCost as never,
          batchNumber: item.batchNumber ?? null,
          expiryDate: item.expiryDate ?? null,
          createdAt: new Date(),
        } as GoodsReceiptItem;
      }),
    } as GoodsReceiptWithItems;
    receipt.items.forEach((item) => {
      (item as GoodsReceiptItem).goodsReceiptId = receipt.id;
    });
    this.receipts.set(receipt.id, receipt);
    return receipt;
  }

  async findById(id: string): Promise<GoodsReceiptWithItems | null> {
    return this.receipts.get(id) ?? null;
  }

  async findByNumber(goodsReceiptNumber: string): Promise<GoodsReceipt | null> {
    return [...this.receipts.values()].find((r) => r.goodsReceiptNumber === goodsReceiptNumber) ?? null;
  }

  async markPosted(id: string, postedBy: string, postedAt: Date): Promise<GoodsReceiptWithItems> {
    const receipt = this.receipts.get(id);
    if (!receipt) throw new Error('not found');
    receipt.status = 'POSTED';
    receipt.postedBy = postedBy;
    receipt.postedAt = postedAt;
    return receipt;
  }

  async count(): Promise<number> {
    return this.receipts.size;
  }
}

export class FakeStockTransferRepository implements IStockTransferRepository {
  transfers = new Map<string, StockTransferWithItems>();
  private itemSequence = 0;

  async create(input: CreateStockTransferInput): Promise<StockTransferWithItems> {
    const transfer: StockTransferWithItems = {
      id: nextFakeUuid(),
      transferNumber: input.transferNumber,
      sourceWarehouseId: input.sourceWarehouseId,
      destinationWarehouseId: input.destinationWarehouseId,
      status: 'DRAFT',
      notes: input.notes ?? null,
      submittedAt: null,
      approvedBy: null,
      approvedAt: null,
      dispatchedBy: null,
      dispatchedAt: null,
      receivedBy: null,
      receivedAt: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      items: input.items.map((item) => {
        this.itemSequence += 1;
        return {
          id: `sti-${this.itemSequence}-${nextFakeUuid()}`,
          transferId: '',
          itemId: item.itemId,
          quantity: item.quantity as never,
          createdAt: new Date(),
        } as StockTransferItem;
      }),
    } as StockTransferWithItems;
    transfer.items.forEach((item) => {
      (item as StockTransferItem).transferId = transfer.id;
    });
    this.transfers.set(transfer.id, transfer);
    return transfer;
  }

  async findById(id: string): Promise<StockTransferWithItems | null> {
    return this.transfers.get(id) ?? null;
  }

  async updateStatus(
    id: string,
    status: StockTransferStatus,
    fields: Partial<{
      submittedAt: Date;
      approvedBy: string;
      approvedAt: Date;
      dispatchedBy: string;
      dispatchedAt: Date;
      receivedBy: string;
      receivedAt: Date;
    }>,
  ): Promise<StockTransferWithItems> {
    const transfer = this.transfers.get(id);
    if (!transfer) throw new Error('not found');
    transfer.status = status;
    Object.assign(transfer, fields);
    return transfer;
  }

  async count(): Promise<number> {
    return this.transfers.size;
  }

  async findByNumber(transferNumber: string): Promise<StockTransfer | null> {
    return [...this.transfers.values()].find((t) => t.transferNumber === transferNumber) ?? null;
  }
}

export class FakeStockAdjustmentRepository implements IStockAdjustmentRepository {
  adjustments = new Map<string, StockAdjustmentWithItems>();
  private itemSequence = 0;

  async create(input: CreateStockAdjustmentInput): Promise<StockAdjustmentWithItems> {
    const adjustment: StockAdjustmentWithItems = {
      id: nextFakeUuid(),
      adjustmentNumber: input.adjustmentNumber,
      warehouseId: input.warehouseId,
      direction: input.direction,
      reasonCode: input.reasonCode,
      status: 'DRAFT',
      approvedBy: null,
      approvedAt: null,
      postedBy: null,
      postedAt: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      items: input.items.map((item) => {
        this.itemSequence += 1;
        return {
          id: `sai-${this.itemSequence}-${nextFakeUuid()}`,
          adjustmentId: '',
          itemId: item.itemId,
          quantity: item.quantity as never,
          createdAt: new Date(),
        } as StockAdjustmentItem;
      }),
    } as StockAdjustmentWithItems;
    adjustment.items.forEach((item) => {
      (item as StockAdjustmentItem).adjustmentId = adjustment.id;
    });
    this.adjustments.set(adjustment.id, adjustment);
    return adjustment;
  }

  async findById(id: string): Promise<StockAdjustmentWithItems | null> {
    return this.adjustments.get(id) ?? null;
  }

  async updateStatus(
    id: string,
    status: StockAdjustmentStatus,
    fields: Partial<{ approvedBy: string; approvedAt: Date; postedBy: string; postedAt: Date }>,
  ): Promise<StockAdjustmentWithItems> {
    const adjustment = this.adjustments.get(id);
    if (!adjustment) throw new Error('not found');
    adjustment.status = status;
    Object.assign(adjustment, fields);
    return adjustment;
  }

  async count(): Promise<number> {
    return this.adjustments.size;
  }

  async findByNumber(adjustmentNumber: string): Promise<StockAdjustment | null> {
    return [...this.adjustments.values()].find((a) => a.adjustmentNumber === adjustmentNumber) ?? null;
  }
}

export class FakeStockReservationRepository implements IStockReservationRepository {
  reservations = new Map<string, StockReservation>();

  async create(input: CreateStockReservationInput): Promise<StockReservation> {
    const reservation: StockReservation = {
      id: nextFakeUuid(),
      warehouseId: input.warehouseId,
      itemId: input.itemId,
      quantity: input.quantity as never,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      status: 'ACTIVE',
      releasedBy: null,
      releasedAt: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
    } as StockReservation;
    this.reservations.set(reservation.id, reservation);
    return reservation;
  }

  async findById(id: string): Promise<StockReservation | null> {
    return this.reservations.get(id) ?? null;
  }

  async markReleased(id: string, releasedBy: string, releasedAt: Date): Promise<StockReservation> {
    const reservation = this.reservations.get(id);
    if (!reservation) throw new Error('not found');
    reservation.status = 'RELEASED';
    reservation.releasedBy = releasedBy;
    reservation.releasedAt = releasedAt;
    return reservation;
  }
}
