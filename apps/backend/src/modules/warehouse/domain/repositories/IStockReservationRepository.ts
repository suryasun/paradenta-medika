import { StockReservation } from '@prisma/client';

export interface CreateStockReservationInput {
  warehouseId: string;
  itemId: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  createdBy: string;
}

export interface IStockReservationRepository {
  create(input: CreateStockReservationInput): Promise<StockReservation>;
  findById(id: string): Promise<StockReservation | null>;
  markReleased(id: string, releasedBy: string, releasedAt: Date): Promise<StockReservation>;
}
