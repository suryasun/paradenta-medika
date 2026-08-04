import { StockAdjustmentDirection, StockAdjustmentStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IStockAdjustmentRepository } from '../../domain/repositories/IStockAdjustmentRepository';
import { ListStockAdjustmentQueryDto } from '../dtos/StockAdjustmentQueryDto';
import { StockAdjustmentResponseDto } from '../dtos/StockAdjustmentResponseDto';
import { toStockAdjustmentResponseDto } from '../mappers/StockAdjustmentMapper';

export class ListStockAdjustmentUseCase {
  constructor(private readonly stockAdjustmentRepository: IStockAdjustmentRepository) {}

  async execute(query: ListStockAdjustmentQueryDto): Promise<PagedResult<StockAdjustmentResponseDto>> {
    const { items, total } = await this.stockAdjustmentRepository.list(query, {
      warehouseId: query.warehouseId,
      direction: query.direction as StockAdjustmentDirection | undefined,
      status: query.status as StockAdjustmentStatus | undefined,
    });
    return { items: items.map(toStockAdjustmentResponseDto), total };
  }
}
