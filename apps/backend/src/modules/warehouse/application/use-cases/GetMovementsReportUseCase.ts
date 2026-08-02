import { WarehouseStockTransactionType } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IWarehouseReportRepository } from '../../domain/repositories/IWarehouseReportRepository';
import { MovementsQueryDto } from '../dtos/ReportQueryDto';
import { StockLedgerEntryResponseDto } from '../dtos/StockResponseDto';
import { toStockLedgerEntryResponseDto } from '../mappers/StockMapper';

/** docs/06-tasks/task-139.md: "In/out by type, reference, actor" across warehouses/items, filter-driven. */
export class GetMovementsReportUseCase {
  constructor(private readonly reportRepository: IWarehouseReportRepository) {}

  async execute(query: MovementsQueryDto): Promise<PagedResult<StockLedgerEntryResponseDto>> {
    const { items, total } = await this.reportRepository.getMovements(
      {
        warehouseId: query.warehouseId,
        itemId: query.itemId,
        transactionType: query.transactionType as WarehouseStockTransactionType | undefined,
        referenceType: query.referenceType,
        performedBy: query.performedBy,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      },
      query,
    );
    return { items: items.map(toStockLedgerEntryResponseDto), total };
  }
}
