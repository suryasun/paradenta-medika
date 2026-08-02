import { Prisma, StockOpname, StockOpnameStatus } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateStockOpnameInput,
  IStockOpnameRepository,
  ReplaceStockOpnameScopeInput,
  StockOpnameListFilter,
  StockOpnameWithItems,
  SubmitStockOpnameLineInput,
} from '../../domain/repositories/IStockOpnameRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'opnameDate', 'opnameNumber'] as const;

export class StockOpnameRepository implements IStockOpnameRepository {
  async create(input: CreateStockOpnameInput): Promise<StockOpnameWithItems> {
    return prisma.stockOpname.create({
      data: {
        opnameNumber: input.opnameNumber,
        warehouseId: input.warehouseId,
        opnameDate: input.opnameDate,
        notes: input.notes,
        createdBy: input.createdBy,
        items: {
          create: input.itemIds.map((itemId) => ({ itemId })),
        },
      },
      include: { items: true },
    });
  }

  async list(query: ListQueryDto, filter: StockOpnameListFilter): Promise<PagedResult<StockOpnameWithItems>> {
    const where: Prisma.StockOpnameWhereInput = {
      warehouseId: filter.warehouseId,
      status: filter.status,
    };
    const [items, total] = await Promise.all([
      prisma.stockOpname.findMany({
        where,
        include: { items: true },
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.stockOpname.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<StockOpnameWithItems | null> {
    return prisma.stockOpname.findUnique({ where: { id }, include: { items: true } });
  }

  async findActive(warehouseId: string, opnameDate: Date): Promise<StockOpname | null> {
    return prisma.stockOpname.findFirst({
      where: { warehouseId, opnameDate, status: { notIn: ['POSTED', 'REJECTED'] } },
    });
  }

  async replaceScope(id: string, input: ReplaceStockOpnameScopeInput): Promise<StockOpnameWithItems> {
    return prisma.$transaction(async (tx) => {
      if (input.itemIds) {
        await tx.stockOpnameItem.deleteMany({ where: { opnameId: id } });
        await tx.stockOpnameItem.createMany({
          data: input.itemIds.map((itemId) => ({ opnameId: id, itemId })),
        });
      }

      return tx.stockOpname.update({
        where: { id },
        data: { notes: input.notes, updatedBy: input.updatedBy },
        include: { items: true },
      });
    });
  }

  async startCount(id: string, systemQuantities: Map<string, number>, snapshotAt: Date): Promise<StockOpnameWithItems> {
    return prisma.$transaction(async (tx) => {
      for (const [itemId, systemQuantity] of systemQuantities) {
        await tx.stockOpnameItem.updateMany({
          where: { opnameId: id, itemId },
          data: { systemQuantity },
        });
      }

      return tx.stockOpname.update({
        where: { id },
        data: { status: 'COUNTING', snapshotAt },
        include: { items: true },
      });
    });
  }

  async submit(id: string, lines: SubmitStockOpnameLineInput[], submittedAt: Date): Promise<StockOpnameWithItems> {
    return prisma.$transaction(async (tx) => {
      for (const line of lines) {
        const existing = await tx.stockOpnameItem.findFirst({ where: { opnameId: id, itemId: line.itemId } });
        const systemQuantity = existing?.systemQuantity ? Number(existing.systemQuantity) : 0;
        await tx.stockOpnameItem.updateMany({
          where: { opnameId: id, itemId: line.itemId },
          data: {
            physicalQuantity: line.physicalQuantity,
            variance: line.physicalQuantity - systemQuantity,
            notes: line.notes,
          },
        });
      }

      return tx.stockOpname.update({
        where: { id },
        data: { status: 'SUBMITTED', submittedAt },
        include: { items: true },
      });
    });
  }

  async updateStatus(
    id: string,
    status: StockOpnameStatus,
    fields: { approvedBy?: string; approvedAt?: Date; postedBy?: string; postedAt?: Date },
  ): Promise<StockOpnameWithItems> {
    return prisma.stockOpname.update({
      where: { id },
      data: { status, ...fields },
      include: { items: true },
    });
  }

  async count(): Promise<number> {
    return prisma.stockOpname.count();
  }

  async findByNumber(opnameNumber: string): Promise<StockOpname | null> {
    return prisma.stockOpname.findUnique({ where: { opnameNumber } });
  }
}
