import { IReservationRepository } from '../../../reservation/domain/repositories/IReservationRepository';
import { ReservationResponseDto } from '../../../reservation/application/dtos/ReservationResponseDto';
import { toReservationResponse } from '../../../reservation/application/mappers/ReservationMapper';
import { groupByDate, groupByMonth } from '../../../reservation/application/use-cases/ReservationAnalyticsUseCase';
import { DateCountPoint } from '../../../reservation/application/dtos/ReservationAnalyticsResponseDto';
import { ReportFilterInvalidException } from '../../domain/exceptions/ReportExceptions';

export interface ReservationByDoctorReportFilters {
  dateFrom: string;
  dateTo: string;
  doctorId?: string;
  status?: string;
  groupBy?: 'day' | 'month';
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export interface DoctorCountEntry {
  doctorId: string;
  count: number;
}

export interface ReservationByDoctorReportSummary {
  totalDoctors: number;
  breakdown: DoctorCountEntry[];
  trend: DateCountPoint[];
}

export interface ReservationByDoctorReportResult {
  items: ReservationResponseDto[];
  total: number;
  summary: ReservationByDoctorReportSummary;
}

/**
 * docs/06-tasks/task-301.md (Reservation Module Addendum #3): the
 * paginated `items` respect an optional `doctorId` filter (reusing
 * `search()`'s existing support for it, task-031), but `summary.breakdown`
 * -- the cross-doctor comparison chart -- is always computed over ALL
 * doctors in range via `findAllInDateRange` (never filtered by doctorId),
 * so selecting one doctor to narrow the table never distorts the
 * comparison chart. Doctor *names* are resolved client-side via the
 * existing `useDoctors()` pattern (Doctor is a small bounded roster,
 * unlike Patient) -- mirrors `ReservationAnalyticsUseCase`'s own
 * `doctorUtilization`, which likewise returns raw `doctorId`, not a name.
 *
 * docs/06-tasks/task-307.md/task-310.md (Reservation Module Addendum #4):
 * adds an optional `status` filter -- unlike `doctorId` (the report's own
 * dimension), `status` is a cross-cutting filter and narrows BOTH the table
 * and `summary` (breakdown + the new `trend`), consistent with how the
 * dateFrom/dateTo range already narrows both. `summary.trend` (day/month via
 * `groupBy`) is computed from the same `allInRange` array already fetched
 * for `breakdown` -- unfiltered by doctorId, same as breakdown.
 */
export class GetReservationByDoctorReportUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async execute(filters: ReservationByDoctorReportFilters): Promise<ReservationByDoctorReportResult> {
    const from = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    const to = new Date(`${filters.dateTo}T23:59:59.999Z`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new ReportFilterInvalidException('dateFrom/dateTo must be valid dates');
    }
    if (from.getTime() > to.getTime()) {
      throw new ReportFilterInvalidException('dateFrom must not be after dateTo');
    }

    const status = filters.status === 'ALL' ? undefined : filters.status;

    const [{ items, total }, allInRange] = await Promise.all([
      this.reservationRepository.search({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        doctorId: filters.doctorId,
        status,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        order: filters.order,
      }),
      this.reservationRepository.findAllInDateRange(from, to, undefined, undefined, status),
    ]);

    const doctorCounts = new Map<string, number>();
    for (const reservation of allInRange) {
      doctorCounts.set(reservation.doctorId, (doctorCounts.get(reservation.doctorId) ?? 0) + 1);
    }
    const breakdown = [...doctorCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([doctorId, count]) => ({ doctorId, count }));
    const trend = filters.groupBy === 'month' ? groupByMonth(allInRange) : groupByDate(allInRange);

    return {
      items: items.map(toReservationResponse),
      total,
      summary: { totalDoctors: breakdown.length, breakdown, trend },
    };
  }
}
