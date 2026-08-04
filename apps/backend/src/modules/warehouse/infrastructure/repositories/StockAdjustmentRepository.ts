import { Prisma, StockAdjustment, StockAdjustmentStatus } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateStockAdjustmentInput,
  IStockAdjustmentRepository,
  StockAdjustmentListFilter,
  StockAdjustmentWithItems,
} from '../../domain/repositories/IStockAdjustmentRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'adjustmentNumber'] as const;

export class StockAdjustmentRepository implements IStockAdjustmentRepository {
  async create(input: CreateStockAdjustmentInput): Promise<StockAdjustmentWithItems> {
    return prisma.stockAdjustment.create({
      data: {
        adjustmentNumber: input.adjustmentNumber,
        warehouseId: input.warehouseId,
        direction: input.direction,
        reasonCode: input.reasonCode,
        createdBy: input.createdBy,
        items: { create: input.items.map((item) => ({ itemId: item.itemId, quantity: item.quantity })) },
      },
      include: { items: true },
    });
  }

  async list(query: ListQueryDto, filter: StockAdjustmentListFilter): Promise<PagedResult<StockAdjustmentWithItems>> {
    const where: Prisma.StockAdjustmentWhereInput = {
      warehouseId: filter.warehouseId,
      direction: filter.direction,
      status: filter.status,
    };
    const [items, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        include: { items: true },
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.stockAdjustment.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<StockAdjustmentWithItems | null> {
    return prisma.stockAdjustment.findUnique({ where: { id }, include: { items: true } });
  }

  async updateStatus(
    id: string,
    status: StockAdjustmentStatus,
    fields: { approvedBy?: string; approvedAt?: Date; postedBy?: string; postedAt?: Date },
  ): Promise<StockAdjustmentWithItems> {
    return prisma.stockAdjustment.update({ where: { id }, data: { status, ...fields }, include: { items: true } });
  }

  async count(): Promise<number> {
    return prisma.stockAdjustment.count();
  }

  async findByNumber(adjustmentNumber: string): Promise<StockAdjustment | null> {
    return prisma.stockAdjustment.findUnique({ where: { adjustmentNumber } });
  }
}
