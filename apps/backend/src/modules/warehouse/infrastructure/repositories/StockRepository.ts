import { Prisma, StockTransaction, WarehouseStock } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { IStockRepository, StockListFilter } from '../../domain/repositories/IStockRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'currentStock', 'availableStock'] as const;

export class StockRepository implements IStockRepository {
  async list(query: ListQueryDto, filter: StockListFilter): Promise<PagedResult<WarehouseStock>> {
    const where: Prisma.WarehouseStockWhereInput = {
      itemId: filter.itemId,
      warehouseId: filter.warehouseId,
    };
    const [items, total] = await Promise.all([
      prisma.warehouseStock.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.warehouseStock.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<WarehouseStock | null> {
    return prisma.warehouseStock.findUnique({ where: { id } });
  }

  async findLedgerByWarehouseAndItem(warehouseId: string, itemId: string): Promise<StockTransaction[]> {
    return prisma.stockTransaction.findMany({
      where: { warehouseId, itemId },
      orderBy: { transactionDate: 'asc' },
    });
  }
}
