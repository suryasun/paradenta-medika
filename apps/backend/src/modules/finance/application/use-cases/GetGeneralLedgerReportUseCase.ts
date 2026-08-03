import { PagedResult } from '../../../../shared/http/pagination';
import { GeneralLedgerRow, IFinanceReportRepository } from '../../domain/repositories/IFinanceReportRepository';
import { ReportDateRangeResolver } from '../services/ReportDateRangeResolver';
import { GeneralLedgerQueryDto } from '../dtos/ReportQueryDto';

/** docs/06-tasks/task-173.md: "Journal lines by account", posted journals only. */
export class GetGeneralLedgerReportUseCase {
  constructor(
    private readonly reportRepository: IFinanceReportRepository,
    private readonly dateRangeResolver: ReportDateRangeResolver,
  ) {}

  async execute(query: GeneralLedgerQueryDto): Promise<PagedResult<GeneralLedgerRow>> {
    const { dateFrom, dateTo } = await this.dateRangeResolver.resolve(query);
    return this.reportRepository.getGeneralLedger({ branchId: query.branchId, accountId: query.accountId, dateFrom, dateTo }, query);
  }
}
