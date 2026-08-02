import { StockNotFoundException } from '../../domain/exceptions/WarehouseExceptions';
import { IStockRepository } from '../../domain/repositories/IStockRepository';
import { StockLedgerEntryResponseDto } from '../dtos/StockResponseDto';
import { toStockLedgerEntryResponseDto } from '../mappers/StockMapper';

/** docs/06-tasks/task-103.md: chronological, correct running balance, traceable to source reference. */
export class GetStockLedgerUseCase {
  constructor(private readonly stockRepository: IStockRepository) {}

  async execute(stockId: string): Promise<StockLedgerEntryResponseDto[]> {
    const stock = await this.stockRepository.findById(stockId);
    if (!stock) {
      throw new StockNotFoundException();
    }

    const transactions = await this.stockRepository.findLedgerByWarehouseAndItem(stock.warehouseId, stock.itemId);
    return transactions.map(toStockLedgerEntryResponseDto);
  }
}
