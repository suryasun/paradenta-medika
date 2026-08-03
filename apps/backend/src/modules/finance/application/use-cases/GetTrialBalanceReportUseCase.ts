import { IFinanceReportRepository, TrialBalanceRow } from '../../domain/repositories/IFinanceReportRepository';
import { ReportDateRangeResolver } from '../services/ReportDateRangeResolver';
import { TrialBalanceQueryDto } from '../dtos/ReportQueryDto';

/** docs/06-tasks/task-172.md: "Account debit/credit/balance by period", posted journals only. */
export class GetTrialBalanceReportUseCase {
  constructor(
    private readonly reportRepository: IFinanceReportRepository,
    private readonly dateRangeResolver: ReportDateRangeResolver,
  ) {}

  async execute(query: TrialBalanceQueryDto): Promise<TrialBalanceRow[]> {
    const { dateFrom, dateTo } = await this.dateRangeResolver.resolve(query);
    return this.reportRepository.getTrialBalance({ branchId: query.branchId, dateFrom, dateTo });
  }
}
