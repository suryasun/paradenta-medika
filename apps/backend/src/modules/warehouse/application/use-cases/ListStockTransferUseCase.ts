import { StockTransferStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IStockTransferRepository } from '../../domain/repositories/IStockTransferRepository';
import { ListStockTransferQueryDto } from '../dtos/StockTransferQueryDto';
import { StockTransferResponseDto } from '../dtos/StockTransferResponseDto';
import { toStockTransferResponseDto } from '../mappers/StockTransferMapper';

export class ListStockTransferUseCase {
  constructor(private readonly stockTransferRepository: IStockTransferRepository) {}

  async execute(query: ListStockTransferQueryDto): Promise<PagedResult<StockTransferResponseDto>> {
    const { items, total } = await this.stockTransferRepository.list(query, {
      sourceWarehouseId: query.sourceWarehouseId,
      destinationWarehouseId: query.destinationWarehouseId,
      status: query.status as StockTransferStatus | undefined,
    });
    return { items: items.map(toStockTransferResponseDto), total };
  }
}
