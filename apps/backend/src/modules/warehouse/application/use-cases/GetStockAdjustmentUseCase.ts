import { StockAdjustmentNotFoundException } from '../../domain/exceptions/WarehouseExceptions';
import { IStockAdjustmentRepository } from '../../domain/repositories/IStockAdjustmentRepository';
import { StockAdjustmentResponseDto } from '../dtos/StockAdjustmentResponseDto';
import { toStockAdjustmentResponseDto } from '../mappers/StockAdjustmentMapper';

export class GetStockAdjustmentUseCase {
  constructor(private readonly stockAdjustmentRepository: IStockAdjustmentRepository) {}

  async execute(adjustmentId: string): Promise<StockAdjustmentResponseDto> {
    const adjustment = await this.stockAdjustmentRepository.findById(adjustmentId);
    if (!adjustment) {
      throw new StockAdjustmentNotFoundException();
    }
    return toStockAdjustmentResponseDto(adjustment);
  }
}
