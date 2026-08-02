import { PagedResult } from '../../../../shared/http/pagination';
import { IWarehouseReportRepository } from '../../domain/repositories/IWarehouseReportRepository';
import { StockCardQueryDto } from '../dtos/ReportQueryDto';
import { StockLedgerEntryResponseDto } from '../dtos/StockResponseDto';
import { toStockLedgerEntryResponseDto } from '../mappers/StockMapper';

/** docs/06-tasks/task-137.md: "Kartu stok" -- immutable in/out/balance sequence for one item/warehouse pair over a period. */
export class GetStockCardReportUseCase {
  constructor(private readonly reportRepository: IWarehouseReportRepository) {}

  async execute(query: StockCardQueryDto): Promise<PagedResult<StockLedgerEntryResponseDto>> {
    const { items, total } = await this.reportRepository.getStockCard(
      {
        warehouseId: query.warehouseId,
        itemId: query.itemId,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      },
      query,
    );
    return { items: items.map(toStockLedgerEntryResponseDto), total };
  }
}
