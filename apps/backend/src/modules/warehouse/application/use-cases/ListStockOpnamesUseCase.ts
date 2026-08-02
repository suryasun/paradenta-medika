import { StockOpnameStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IStockOpnameRepository } from '../../domain/repositories/IStockOpnameRepository';
import { ListStockOpnameQueryDto } from '../dtos/StockOpnameQueryDto';
import { StockOpnameResponseDto } from '../dtos/StockOpnameResponseDto';
import { toStockOpnameResponseDto } from '../mappers/StockOpnameMapper';

export class ListStockOpnamesUseCase {
  constructor(private readonly stockOpnameRepository: IStockOpnameRepository) {}

  async execute(query: ListStockOpnameQueryDto): Promise<PagedResult<StockOpnameResponseDto>> {
    const { items, total } = await this.stockOpnameRepository.list(query, {
      warehouseId: query.warehouseId,
      status: query.status as StockOpnameStatus | undefined,
    });
    return { items: items.map(toStockOpnameResponseDto), total };
  }
}
