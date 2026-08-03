import { IFinanceReportRepository, IncomeStatementResult } from '../../domain/repositories/IFinanceReportRepository';
import { ReportDateRangeResolver } from '../services/ReportDateRangeResolver';
import { IncomeStatementQueryDto } from '../dtos/ReportQueryDto';

/** docs/06-tasks/task-174.md: "Revenue, expense, net result", posted journals only. */
export class GetIncomeStatementReportUseCase {
  constructor(
    private readonly reportRepository: IFinanceReportRepository,
    private readonly dateRangeResolver: ReportDateRangeResolver,
  ) {}

  async execute(query: IncomeStatementQueryDto): Promise<IncomeStatementResult> {
    const { dateFrom, dateTo } = await this.dateRangeResolver.resolve(query);
    return this.reportRepository.getIncomeStatement({ branchId: query.branchId, dateFrom, dateTo });
  }
}
