import { Item, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateItemInput, IItemRepository, UpdateItemInput } from '../../domain/repositories/IItemRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'itemCode', 'itemName'] as const;

function toCreateData(input: CreateItemInput): Prisma.ItemCreateInput {
  return {
    itemCode: input.itemCode,
    itemName: input.itemName,
    category: { connect: { id: input.categoryId } },
    unit: { connect: { id: input.unitId } },
    minimumStock: input.minimumStock,
    purchasePrice: input.purchasePrice ?? 0,
    sellingPrice: input.sellingPrice ?? 0,
    isConsumable: input.isConsumable,
    isBatchTracked: input.isBatchTracked,
    isExpiryTracked: input.isExpiryTracked,
    createdBy: input.createdBy,
  };
}

function toUpdateData(input: UpdateItemInput): Prisma.ItemUpdateInput {
  return {
    itemName: input.itemName,
    category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
    unit: input.unitId ? { connect: { id: input.unitId } } : undefined,
    minimumStock: input.minimumStock,
    purchasePrice: input.purchasePrice,
    sellingPrice: input.sellingPrice,
    isConsumable: input.isConsumable,
    isBatchTracked: input.isBatchTracked,
    isExpiryTracked: input.isExpiryTracked,
    isActive: input.isActive,
    updatedBy: input.updatedBy,
  };
}

export class ItemRepository implements IItemRepository {
  async create(input: CreateItemInput): Promise<Item> {
    return prisma.item.create({ data: toCreateData(input) });
  }

  async list(query: ListQueryDto): Promise<PagedResult<Item>> {
    const where: Prisma.ItemWhereInput = {
      deletedAt: null,
      ...(query.search ? { OR: [{ itemCode: { contains: query.search } }, { itemName: { contains: query.search } }] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.item.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.item.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Item | null> {
    return prisma.item.findFirst({ where: { id, deletedAt: null } });
  }

  async findByCode(itemCode: string): Promise<Item | null> {
    return prisma.item.findFirst({ where: { itemCode, deletedAt: null } });
  }

  async update(id: string, input: UpdateItemInput): Promise<Item> {
    return prisma.item.update({ where: { id }, data: toUpdateData(input) });
  }

  async hasStockLedgerEntries(itemId: string): Promise<boolean> {
    const count = await prisma.stockTransaction.count({ where: { itemId } });
    return count > 0;
  }
}
