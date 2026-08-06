import { IReservationRepository } from '../../../reservation/domain/repositories/IReservationRepository';
import { ReservationResponseDto } from '../../../reservation/application/dtos/ReservationResponseDto';
import { toReservationResponse } from '../../../reservation/application/mappers/ReservationMapper';
import { groupByDate } from '../../../reservation/application/use-cases/ReservationAnalyticsUseCase';
import { DateCountPoint } from '../../../reservation/application/dtos/ReservationAnalyticsResponseDto';
import { ReportFilterInvalidException } from '../../domain/exceptions/ReportExceptions';

export interface CompletedReservationReportFilters {
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export interface CompletedReservationReportSummary {
  totalCompleted: number;
  trend: DateCountPoint[];
}

export interface CompletedReservationReportResult {
  items: ReservationResponseDto[];
  total: number;
  summary: CompletedReservationReportSummary;
}

/**
 * docs/06-tasks/task-299.md (Reservation Module Addendum #2, R7): the same
 * dual-read shape GetNewPatientReportUseCase (task-291) established --
 * paginated `items` via `search()` (now carrying patientMrn/patientFullName
 * for free, per task-296/R1), plus a full-range `findAllInDateRange()` read
 * for `summary` (total + a day-by-day trend for the report's chart, reusing
 * ReservationAnalyticsUseCase's own groupByDate rather than
 * re-implementing it).
 */
export class GetCompletedReservationReportUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async execute(filters: CompletedReservationReportFilters): Promise<CompletedReservationReportResult> {
    const from = new Date(`${filters.dateFrom}T00:00:00.000Z`);
    const to = new Date(`${filters.dateTo}T23:59:59.999Z`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      throw new ReportFilterInvalidException('dateFrom/dateTo must be valid dates');
    }
    if (from.getTime() > to.getTime()) {
      throw new ReportFilterInvalidException('dateFrom must not be after dateTo');
    }

    const [{ items, total }, allInRange] = await Promise.all([
      this.reservationRepository.search({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        status: 'COMPLETED',
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        order: filters.order,
      }),
      this.reservationRepository.findAllInDateRange(from, to, undefined, undefined, 'COMPLETED'),
    ]);

    return {
      items: items.map(toReservationResponse),
      total,
      summary: { totalCompleted: allInRange.length, trend: groupByDate(allInRange) },
    };
  }
}
