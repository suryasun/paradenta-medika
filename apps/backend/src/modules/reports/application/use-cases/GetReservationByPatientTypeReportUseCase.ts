import { IReservationRepository } from '../../../reservation/domain/repositories/IReservationRepository';
import { ReservationResponseDto } from '../../../reservation/application/dtos/ReservationResponseDto';
import { toReservationResponse } from '../../../reservation/application/mappers/ReservationMapper';
import { ReportFilterInvalidException } from '../../domain/exceptions/ReportExceptions';

export interface ReservationByPatientTypeReportFilters {
  dateFrom: string;
  dateTo: string;
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

    const [{ items, total }, allInRange] = await Promise.all([
      this.reservationRepository.search({
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        order: filters.order,
      }),
      this.reservationRepository.findAllInDateRange(from, to),
    ]);

    const newCount = allInRange.filter((r) => r.patientTypeAtBooking === 'NEW').length;
    const oldCount = allInRange.filter((r) => r.patientTypeAtBooking === 'OLD').length;
    const denominator = newCount + oldCount;
    const newPercentage = denominator === 0 ? 0 : Math.round((newCount / denominator) * 10000) / 100;
    const oldPercentage = denominator === 0 ? 0 : Math.round((oldCount / denominator) * 10000) / 100;

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
      },
    };
  }
}
