import { PagedResult } from '../../../../shared/http/pagination';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { IStockRepository, StockListFilter } from '../../domain/repositories/IStockRepository';
import { StockQueryDto } from '../dtos/StockQueryDto';
import { StockResponseDto } from '../dtos/StockResponseDto';
import { toStockResponseDto } from '../mappers/StockMapper';

export class ListStocksUseCase {
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
