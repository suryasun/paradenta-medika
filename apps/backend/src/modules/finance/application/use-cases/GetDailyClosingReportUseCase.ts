import { DailyClosingStatus } from '@prisma/client';
import { PagedResult } from '../../../../shared/http/pagination';
import { IDailyClosingRepository } from '../../domain/repositories/IDailyClosingRepository';
import { ReportDateRangeResolver } from '../services/ReportDateRangeResolver';
import { DailyClosingReportQueryDto } from '../dtos/ReportQueryDto';
import { DailyClosingResponseDto } from '../dtos/DailyClosingResponseDto';
import { toDailyClosingResponseDto } from '../mappers/DailyClosingMapper';

/**
 * docs/06-tasks/task-177.md: "Expected/count/variance/approval" --
 * DailyClosing's own fields already match this shape, so this wraps
 * IDailyClosingRepository.list with a mandatory branchId and a resolved
 * date range, the same reuse pattern as GetExpensesReportUseCase.
 */
export class GetDailyClosingReportUseCase {
  constructor(
    private readonly dailyClosingRepository: IDailyClosingRepository,
    private readonly dateRangeResolver: ReportDateRangeResolver,
  ) {}

  async execute(query: DailyClosingReportQueryDto): Promise<PagedResult<DailyClosingResponseDto>> {
    const { dateFrom, dateTo } = await this.dateRangeResolver.resolve(query);
    const { items, total } = await this.dailyClosingRepository.list(query, {
      branchId: query.branchId,
      cashAccountId: query.cashAccountId,
      status: query.status as DailyClosingStatus | undefined,
      dateFrom,
      dateTo,
    });
    return { items: items.map(toDailyClosingResponseDto), total };
  }
}
