import { Item, StockTransaction, Supplier, WarehouseLocation, WarehouseStock } from '@prisma/client';
import { CreateItemInput, IItemRepository, UpdateItemInput } from '../../src/modules/warehouse/domain/repositories/IItemRepository';
import { CreateSupplierInput, ISupplierRepository } from '../../src/modules/warehouse/domain/repositories/ISupplierRepository';
import {
  CreateWarehouseLocationInput,
  IWarehouseLocationRepository,
} from '../../src/modules/warehouse/domain/repositories/IWarehouseLocationRepository';
import { IStockRepository, StockListFilter } from '../../src/modules/warehouse/domain/repositories/IStockRepository';
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

  async findLedgerByWarehouseAndItem(warehouseId: string, itemId: string): Promise<StockTransaction[]> {
    return this.transactions
      .filter((t) => t.warehouseId === warehouseId && t.itemId === itemId)
      .sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());
  }
}
