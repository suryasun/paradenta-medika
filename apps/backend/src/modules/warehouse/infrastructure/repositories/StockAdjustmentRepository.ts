import { StockAdjustment, StockAdjustmentStatus } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import {
  CreateStockAdjustmentInput,
  IStockAdjustmentRepository,
  StockAdjustmentWithItems,
} from '../../domain/repositories/IStockAdjustmentRepository';

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
