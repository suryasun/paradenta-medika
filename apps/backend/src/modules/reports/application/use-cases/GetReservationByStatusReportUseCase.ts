import { IReservationRepository } from '../../../reservation/domain/repositories/IReservationRepository';
import { ReservationResponseDto } from '../../../reservation/application/dtos/ReservationResponseDto';
import { toReservationResponse } from '../../../reservation/application/mappers/ReservationMapper';
import { groupByDate, groupByMonth } from '../../../reservation/application/use-cases/ReservationAnalyticsUseCase';
import { DateCountPoint } from '../../../reservation/application/dtos/ReservationAnalyticsResponseDto';
import { ReportFilterInvalidException } from '../../domain/exceptions/ReportExceptions';

export interface ReservationByStatusReportFilters {
  dateFrom: string;
  dateTo: string;
  status?: string;
  groupBy?: 'day' | 'month';
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export interface ReservationByStatusReportSummary {
  total: number;
  trend: DateCountPoint[];
}

export interface ReservationByStatusReportResult {
  items: ReservationResponseDto[];
  total: number;
  summary: ReservationByStatusReportSummary;
}

const DEFAULT_STATUS = 'COMPLETED';
const ALL_STATUSES = 'ALL';

/**
 * docs/06-tasks/task-305.md (Reservation Module Addendum #4): renamed from
 * GetCompletedReservationReportUseCase (task-299) -- same dual-read shape
 * (paginated `items` via `search()`, a full-range `findAllInDateRange()` read
 * for `summary`), but `status` is now a caller-supplied filter instead of a
 * hardcoded 'COMPLETED'. Omitting `status` defaults to 'COMPLETED' (the
 * report's original behavior, for back-compat callers); the frontend's
 * explicit "All Statuses" option sends `status=ALL`, which clears the
 * filter entirely -- the only way to see every status, since simply omitting
 * the param can't be distinguished from "just use the default". The same
 * resolved status is used for both reads, so the table and trend chart
 * always agree. `groupBy` switches the trend between groupByDate/groupByMonth
 * (default day).
 */
export class GetReservationByStatusReportUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async execute(filters: ReservationByStatusReportFilters): Promise<ReservationByStatusReportResult> {
    const from = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    const to = new Date(`${filters.dateTo}T23:59:59.999Z`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new ReportFilterInvalidException('dateFrom/dateTo must be valid dates');
    }
    if (from.getTime() > to.getTime()) {
      throw new ReportFilterInvalidException('dateFrom must not be after dateTo');
    }

    const resolvedStatus = filters.status ?? DEFAULT_STATUS;
    const status = resolvedStatus === ALL_STATUSES ? undefined : resolvedStatus;

    const [{ items, total }, allInRange] = await Promise.all([
      this.reservationRepository.search({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        status,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        order: filters.order,
      }),
      this.reservationRepository.findAllInDateRange(from, to, undefined, undefined, status),
    ]);

    const trend = filters.groupBy === 'month' ? groupByMonth(allInRange) : groupByDate(allInRange);

    return {
      items: items.map(toReservationResponse),
      total,
      summary: { total: allInRange.length, trend },
    };
  }
}
