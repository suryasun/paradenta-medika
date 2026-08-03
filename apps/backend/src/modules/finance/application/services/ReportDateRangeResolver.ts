import { IFinancialPeriodRepository } from '../../domain/repositories/IFinancialPeriodRepository';
import { ReportDateRangeRequiredException, ReportPeriodNotFoundException } from '../../domain/exceptions/FinanceExceptions';

export interface ReportDateRangeInput {
  branchId: string;
  periodId?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * docs/03-sad/17-module-finance.md Section 6.5: "All report endpoints
 * require branchId, dateFrom, and dateTo unless the report uses
 * periodId." Shared by all six Epic AF report use cases rather than
 * duplicating this resolution per report.
 */
export class ReportDateRangeResolver {
  constructor(private readonly financialPeriodRepository: IFinancialPeriodRepository) {}

  async resolve(input: ReportDateRangeInput): Promise<{ dateFrom: Date; dateTo: Date }> {
    if (input.periodId) {
      const period = await this.financialPeriodRepository.findById(input.periodId);
      if (!period || period.branchId !== input.branchId) {
        throw new ReportPeriodNotFoundException();
      }
      return { dateFrom: period.startDate, dateTo: period.endDate };
    }
    if (!input.dateFrom || !input.dateTo) {
      throw new ReportDateRangeRequiredException();
    }
    return { dateFrom: new Date(input.dateFrom), dateTo: new Date(input.dateTo) };
  }
}
