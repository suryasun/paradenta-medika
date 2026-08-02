import { PagedResult } from '../../../../shared/http/pagination';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { IStockRepository, StockListFilter } from '../../domain/repositories/IStockRepository';
import { StockQueryDto } from '../dtos/StockQueryDto';
import { StockResponseDto } from '../dtos/StockResponseDto';
import { toStockResponseDto } from '../mappers/StockMapper';

/**
 * docs/06-tasks/task-138.md: "Current, reserved, available, minimum,
 * status" -- the same shape `GET /warehouse/stocks` (task-102) already
 * returns; exposed as its own reports-namespaced, `warehouse.report.read`
 * -gated endpoint per docs/03-sad/18-module-warehouse.md Section 6.5's
 * literal API table, reusing the same repositories/mapper rather than
 * duplicating the balance-computation logic.
 */
export class GetStockBalanceReportUseCase {
  constructor(
    private readonly stockRepository: IStockRepository,
    private readonly itemRepository: IItemRepository,
  ) {}

  async execute(query: StockQueryDto): Promise<PagedResult<StockResponseDto>> {
    const filter: StockListFilter = { itemId: query.itemId, warehouseId: query.warehouseId };
    const { items: stocks, total } = await this.stockRepository.list(query, filter);

    const itemIds = [...new Set(stocks.map((stock) => stock.itemId))];
    const items = await Promise.all(itemIds.map((itemId) => this.itemRepository.findById(itemId)));
    const minimumStockByItemId = new Map(items.filter((item) => item !== null).map((item) => [item!.id, Number(item!.minimumStock)]));

    return {
      items: stocks.map((stock) => toStockResponseDto(stock, minimumStockByItemId.get(stock.itemId) ?? 0)),
      total,
    };
  }
}
