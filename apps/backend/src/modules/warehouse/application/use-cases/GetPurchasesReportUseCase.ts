import { PurchaseOrderStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IWarehouseReportRepository } from '../../domain/repositories/IWarehouseReportRepository';
import { PurchasesReportQueryDto } from '../dtos/ReportQueryDto';
import { PurchasesReportRowResponseDto } from '../dtos/PurchasesReportResponseDto';
import { toPurchasesReportRowResponseDto } from '../mappers/PurchasesReportMapper';

/** docs/06-tasks/task-140.md: "PO/receipt/vendor analysis" -- ordered vs received quantity and lead time per PO. */
export class GetPurchasesReportUseCase {
  constructor(private readonly reportRepository: IWarehouseReportRepository) {}

  async execute(query: PurchasesReportQueryDto): Promise<PagedResult<PurchasesReportRowResponseDto>> {
    const { items, total } = await this.reportRepository.getPurchasesReport(
      {
        warehouseId: query.warehouseId,
        supplierId: query.supplierId,
        status: query.status as PurchaseOrderStatus | undefined,
        dateFrom: query.dateFrom ? new Date(query.dateFrom) : undefined,
        dateTo: query.dateTo ? new Date(query.dateTo) : undefined,
      },
      query,
    );
    return { items: items.map(toPurchasesReportRowResponseDto), total };
  }
}
