import { Prisma, StockTransfer, StockTransferStatus } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateStockTransferInput,
  IStockTransferRepository,
  StockTransferListFilter,
  StockTransferWithItems,
} from '../../domain/repositories/IStockTransferRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'transferNumber'] as const;

export class StockTransferRepository implements IStockTransferRepository {
  async create(input: CreateStockTransferInput): Promise<StockTransferWithItems> {
    return prisma.stockTransfer.create({
      data: {
        transferNumber: input.transferNumber,
        sourceWarehouseId: input.sourceWarehouseId,
        destinationWarehouseId: input.destinationWarehouseId,
        notes: input.notes,
        createdBy: input.createdBy,
        items: { create: input.items.map((item) => ({ itemId: item.itemId, quantity: item.quantity })) },
      },
      include: { items: true },
    });
  }

  async list(query: ListQueryDto, filter: StockTransferListFilter): Promise<PagedResult<StockTransferWithItems>> {
    const where: Prisma.StockTransferWhereInput = {
      sourceWarehouseId: filter.sourceWarehouseId,
      destinationWarehouseId: filter.destinationWarehouseId,
      status: filter.status,
    };
    const [items, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        include: { items: true },
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.stockTransfer.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<StockTransferWithItems | null> {
    return prisma.stockTransfer.findUnique({ where: { id }, include: { items: true } });
  }

  async updateStatus(
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
  ): Promise<StockTransferWithItems> {
    return prisma.stockTransfer.update({ where: { id }, data: { status, ...fields }, include: { items: true } });
  }

  async count(): Promise<number> {
    return prisma.stockTransfer.count();
  }

  async findByNumber(transferNumber: string): Promise<StockTransfer | null> {
    return prisma.stockTransfer.findUnique({ where: { transferNumber } });
  }
}
