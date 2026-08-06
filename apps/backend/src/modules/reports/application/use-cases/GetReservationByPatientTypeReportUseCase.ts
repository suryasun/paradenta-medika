import { IReservationRepository } from '../../../reservation/domain/repositories/IReservationRepository';
import { ReservationResponseDto } from '../../../reservation/application/dtos/ReservationResponseDto';
import { toReservationResponse } from '../../../reservation/application/mappers/ReservationMapper';
import { groupByDate, groupByMonth } from '../../../reservation/application/use-cases/ReservationAnalyticsUseCase';
import { DateCountPoint } from '../../../reservation/application/dtos/ReservationAnalyticsResponseDto';
import { ReportFilterInvalidException } from '../../domain/exceptions/ReportExceptions';

export interface ReservationByPatientTypeReportFilters {
  dateFrom: string;
  dateTo: string;
  status?: string;
  groupBy?: 'day' | 'month';
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export interface PatientTypeCountEntry {
  type: 'NEW' | 'OLD';
  count: number;
}

export interface ReservationByPatientTypeReportSummary {
  newCount: number;
  oldCount: number;
  newPercentage: number;
  oldPercentage: number;
  breakdown: PatientTypeCountEntry[];
  trend: DateCountPoint[];
}

export interface ReservationByPatientTypeReportResult {
  items: ReservationResponseDto[];
  total: number;
  summary: ReservationByPatientTypeReportSummary;
}

/**
 * docs/06-tasks/task-300.md (Reservation Module Addendum #3): unlike
 * GetNewPatientReportUseCase (task-291), which filters to NEW only, this
 * report shows ALL reservations in range -- both types, distinguished by
 * the existing Patient Type Badge column already rendered client-side
 * (task-290) -- with a NEW-vs-OLD comparison in `summary`. Same dual-read
 * shape: paginated `items` via `search()`, `summary` aggregated over the
 * *full* matching set via `findAllInDateRange` (unfiltered), never scoped
 * to just the current page.
 *
 * docs/06-tasks/task-306.md/task-309.md (Reservation Module Addendum #4):
 * adds an optional `status` filter -- applied to both reads, so the New/Old
 * comparison reflects the filtered status too, not just the table -- and a
 * `summary.trend` (day/month, via `groupBy`) computed from the same
 * `allInRange` array already fetched for the New/Old breakdown, no extra
 * query needed.
 */
export class GetReservationByPatientTypeReportUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async execute(filters: ReservationByPatientTypeReportFilters): Promise<ReservationByPatientTypeReportResult> {
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
        status,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        order: filters.order,
      }),
      this.reservationRepository.findAllInDateRange(from, to, undefined, undefined, status),
    ]);

    const newCount = allInRange.filter((r) => r.patientTypeAtBooking === 'NEW').length;
    const oldCount = allInRange.filter((r) => r.patientTypeAtBooking === 'OLD').length;
    const denominator = newCount + oldCount;
    const newPercentage = denominator === 0 ? 0 : Math.round((newCount / denominator) * 10000) / 100;
    const oldPercentage = denominator === 0 ? 0 : Math.round((oldCount / denominator) * 10000) / 100;
    const trend = filters.groupBy === 'month' ? groupByMonth(allInRange) : groupByDate(allInRange);

    return {
      items: items.map(toReservationResponse),
      total,
      summary: {
        newCount,
        oldCount,
        newPercentage,
        oldPercentage,
        breakdown: [
          { type: 'NEW', count: newCount },
          { type: 'OLD', count: oldCount },
        ],
        trend,
      },
    };
  }
}
