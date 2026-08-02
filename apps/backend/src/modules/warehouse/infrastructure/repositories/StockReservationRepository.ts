import { StockReservation } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { CreateStockReservationInput, IStockReservationRepository } from '../../domain/repositories/IStockReservationRepository';

export class StockReservationRepository implements IStockReservationRepository {
  async create(input: CreateStockReservationInput): Promise<StockReservation> {
    return prisma.stockReservation.create({
      data: {
        warehouseId: input.warehouseId,
        itemId: input.itemId,
        quantity: input.quantity,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        createdBy: input.createdBy,
      },
    });
  }

  async findById(id: string): Promise<StockReservation | null> {
    return prisma.stockReservation.findUnique({ where: { id } });
  }

  async markReleased(id: string, releasedBy: string, releasedAt: Date): Promise<StockReservation> {
    return prisma.stockReservation.update({ where: { id }, data: { status: 'RELEASED', releasedBy, releasedAt } });
  }
}
