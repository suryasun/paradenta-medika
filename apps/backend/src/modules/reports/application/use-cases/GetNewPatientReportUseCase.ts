import { IReservationRepository } from '../../../reservation/domain/repositories/IReservationRepository';
import { ReservationResponseDto } from '../../../reservation/application/dtos/ReservationResponseDto';
import { toReservationResponse } from '../../../reservation/application/mappers/ReservationMapper';
import { ReportFilterInvalidException } from '../../domain/exceptions/ReportExceptions';

export interface NewPatientReportFilters {
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export interface NewPatientReportSummary {
  totalNewPatients: number;
  topProcedure: string | null;
  conversionRate: number;
}

export interface NewPatientReportResult {
  items: ReservationResponseDto[];
  total: number;
  summary: NewPatientReportSummary;
}

const TERMINAL_COMPLETED = 'COMPLETED';
const TERMINAL_NEGATIVE = ['CANCELLED', 'NO_SHOW'];

/**
 * docs/06-tasks/task-291.md: reservations where patient_type_at_booking =
 * NEW within an inclusive [dateFrom, dateTo] range, matching
 * ListReservationsUseCase's existing date-filtering convention. The
 * paginated `items` come from the same `search()` read
 * ListReservationsUseCase already uses (task-290's patientType filter);
 * `summary` is aggregated separately over the *full* matching set via
 * findAllInDateRange, since a summary scoped to only the current page
 * would be misleading.
 */
export class GetNewPatientReportUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async execute(filters: NewPatientReportFilters): Promise<NewPatientReportResult> {
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
        patientType: 'NEW',
        page: filters.page,
        limit: filters.limit,
        sort: filters.sort,
        order: filters.order,
      }),
      this.reservationRepository.findAllInDateRange(from, to, undefined, 'NEW'),
    ]);

    const completedCount = allInRange.filter((r) => r.status === TERMINAL_COMPLETED).length;
    const negativeCount = allInRange.filter((r) => TERMINAL_NEGATIVE.includes(r.status)).length;
    const conversionRate = completedCount + negativeCount > 0 ? Math.round((completedCount / (completedCount + negativeCount)) * 10000) / 100 : 0;

    const procedureCounts = new Map<string, number>();
    for (const reservation of allInRange) {
      procedureCounts.set(reservation.reservationType, (procedureCounts.get(reservation.reservationType) ?? 0) + 1);
    }
    const topProcedure = [...procedureCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    return {
      items: items.map(toReservationResponse),
      total,
      summary: { totalNewPatients: allInRange.length, topProcedure, conversionRate },
    };
  }
}
