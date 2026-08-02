import { Item } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateItemInput {
  itemCode: string;
  itemName: string;
  categoryId: string;
  unitId: string;
  minimumStock: number;
  purchasePrice?: number;
  sellingPrice?: number;
  isConsumable: boolean;
  isBatchTracked: boolean;
  isExpiryTracked: boolean;
  createdBy: string;
}

export interface UpdateItemInput {
  itemName?: string;
  categoryId?: string;
  unitId?: string;
  minimumStock?: number;
  purchasePrice?: number;
  sellingPrice?: number;
  isConsumable?: boolean;
  isBatchTracked?: boolean;
  isExpiryTracked?: boolean;
  isActive?: boolean;
  updatedBy: string;
}

export interface IItemRepository {
  create(input: CreateItemInput): Promise<Item>;
  list(query: ListQueryDto): Promise<PagedResult<Item>>;
  findById(id: string): Promise<Item | null>;
  findByCode(itemCode: string): Promise<Item | null>;
  update(id: string, input: UpdateItemInput): Promise<Item>;
  hasStockLedgerEntries(itemId: string): Promise<boolean>;
}
