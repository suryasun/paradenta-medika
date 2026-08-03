import { CashFlowRow, IFinanceReportRepository } from '../../domain/repositories/IFinanceReportRepository';
import { ReportDateRangeResolver } from '../services/ReportDateRangeResolver';
import { CashFlowQueryDto } from '../dtos/ReportQueryDto';

/** docs/06-tasks/task-175.md: "Inflow/outflow by cash account/category", posted journals only. */
export class GetCashFlowReportUseCase {
  constructor(
    private readonly reportRepository: IFinanceReportRepository,
    private readonly dateRangeResolver: ReportDateRangeResolver,
  ) {}

  async execute(query: CashFlowQueryDto): Promise<CashFlowRow[]> {
    const { dateFrom, dateTo } = await this.dateRangeResolver.resolve(query);
    return this.reportRepository.getCashFlow({ branchId: query.branchId, cashAccountId: query.cashAccountId, dateFrom, dateTo });
  }
}
