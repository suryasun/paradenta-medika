import { StockOpnameStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IStockOpnameRepository } from '../../domain/repositories/IStockOpnameRepository';
import { ListStockOpnameQueryDto } from '../dtos/StockOpnameQueryDto';
import { StockOpnameResponseDto } from '../dtos/StockOpnameResponseDto';
import { toStockOpnameResponseDto } from '../mappers/StockOpnameMapper';

/**
 * docs/06-tasks/task-142.md: "Snapshot, count, variance, approval" -- the
 * same shape `GET /warehouse/stock-opnames` (task-128) already returns,
 * exposed as its own reports-namespaced, `warehouse.report.read`-gated
 * endpoint, reusing `IStockOpnameRepository.list` directly.
 */
export class GetOpnamesReportUseCase {
  constructor(private readonly stockOpnameRepository: IStockOpnameRepository) {}

  async execute(query: ListStockOpnameQueryDto): Promise<PagedResult<StockOpnameResponseDto>> {
    const { items, total } = await this.stockOpnameRepository.list(query, {
      warehouseId: query.warehouseId,
      status: query.status as StockOpnameStatus | undefined,
    });
    return { items: items.map(toStockOpnameResponseDto), total };
  }
}
