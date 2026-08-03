import { ItemBatch, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { BatchListFilter, IBatchRepository, UpsertBatchReceiptInput } from '../../domain/repositories/IBatchRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'expiryDate', 'batchNumber'] as const;

export class BatchRepository implements IBatchRepository {
  async upsertReceipt(input: UpsertBatchReceiptInput): Promise<ItemBatch> {
    const existing = await prisma.itemBatch.findUnique({
      where: {
        warehouseId_itemId_batchNumber: {
          warehouseId: input.warehouseId,
          itemId: input.itemId,
          batchNumber: input.batchNumber,
        },
      },
    });

    if (existing) {
      return prisma.itemBatch.update({
        where: { id: existing.id },
        data: {
          initialQuantity: { increment: input.quantity },
          remainingQuantity: { increment: input.quantity },
        },
      });
    }

    return prisma.itemBatch.create({
      data: {
        warehouseId: input.warehouseId,
        itemId: input.itemId,
        batchNumber: input.batchNumber,
        receivedDate: input.receivedDate,
        expiryDate: input.expiryDate,
        initialQuantity: input.quantity,
        remainingQuantity: input.quantity,
        status: 'ACTIVE',
        createdBy: input.createdBy,
      },
    });
  }

  async findById(id: string): Promise<ItemBatch | null> {
    return prisma.itemBatch.findUnique({ where: { id } });
  }

  async list(query: ListQueryDto, filter: BatchListFilter): Promise<PagedResult<ItemBatch>> {
    const where: Prisma.ItemBatchWhereInput = {
      itemId: filter.itemId,
      warehouseId: filter.warehouseId,
      status: filter.status,
      expiryDate:
        filter.expiryFrom || filter.expiryTo
          ? { gte: filter.expiryFrom, lte: filter.expiryTo }
          : undefined,
    };
    const [items, total] = await Promise.all([
      prisma.itemBatch.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.itemBatch.count({ where }),
    ]);
    return { items, total };
  }

  async markQuarantined(id: string, quarantinedBy: string, quarantinedAt: Date): Promise<ItemBatch> {
    return prisma.itemBatch.update({
      where: { id },
      data: { status: 'QUARANTINED', quarantinedBy, quarantinedAt },
    });
  }

  async findActiveByWarehouseAndItem(warehouseId: string, itemId: string): Promise<ItemBatch[]> {
    return prisma.itemBatch.findMany({
      where: { warehouseId, itemId, status: 'ACTIVE', remainingQuantity: { gt: 0 } },
    });
  }

  async decrementRemaining(id: string, quantity: number): Promise<ItemBatch> {
    return prisma.$transaction(async (tx) => {
      const batch = await tx.itemBatch.findUniqueOrThrow({ where: { id } });
      const newRemaining = Number(batch.remainingQuantity) - quantity;
      return tx.itemBatch.update({
        where: { id },
        data: {
          remainingQuantity: newRemaining,
          status: newRemaining <= 0 ? 'DEPLETED' : batch.status,
        },
      });
    });
  }
}
