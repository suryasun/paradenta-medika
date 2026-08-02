import { Reservation } from '@prisma/client';
import { IReservationRepository } from '../../domain/repositories/IReservationRepository';
import { DateCountPoint, ReservationAnalyticsResponseDto } from '../dtos/ReservationAnalyticsResponseDto';

export interface ReservationAnalyticsInput {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
}

const DEFAULT_RANGE_DAYS = 30;

function toDateOnly(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

function startOfWeek(date: Date): Date {
  const result = toDateOnly(date);
  const dayOfWeek = result.getUTCDay() || 7; // Sunday (0) -> 7
  result.setUTCDate(result.getUTCDate() - (dayOfWeek - 1));
  return result;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const result = new Date(start);
  result.setUTCDate(result.getUTCDate() + 6);
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function groupByDate(reservations: Reservation[]): DateCountPoint[] {
  const counts = new Map<string, number>();
  for (const reservation of reservations) {
    const key = reservation.reservationDate.toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }));
}

/**
 * docs/06-tasks/task-060.md + docs/03-sad/13-module-reservation.md Section
 * 34.5 (7 analytics metrics, literal) + Section 35.1 (4 Operational KPIs --
 * the task's own Acceptance Criteria narrows KPI scope to this subset, not
 * the fuller 35.2/35.3/35.4 lists). Doctor Utilization here is a simple
 * booked-reservation-count-per-doctor within the range (no documented
 * formula for a true booked/available-capacity ratio exists in the SAD),
 * a judgment call flagged inline.
 */
export class ReservationAnalyticsUseCase {
  constructor(private readonly reservationRepository: IReservationRepository) {}

  async execute(input: ReservationAnalyticsInput): Promise<ReservationAnalyticsResponseDto> {
    const now = new Date();
    const dateTo = input.dateTo ? toDateOnly(new Date(input.dateTo)) : toDateOnly(now);
    const dateFrom = input.dateFrom
      ? toDateOnly(new Date(input.dateFrom))
      : new Date(dateTo.getTime() - (DEFAULT_RANGE_DAYS - 1) * 24 * 60 * 60 * 1000);

    const reservationsInRange = await this.reservationRepository.findAllInDateRange(dateFrom, dateTo, input.branchId);

    const totalCount = reservationsInRange.length;
    const completedCount = reservationsInRange.filter((r) => r.status === 'COMPLETED').length;
    const walkinCount = reservationsInRange.filter((r) => r.source === 'WALK_IN').length;
    const cancelledReservations = reservationsInRange.filter((r) => r.status === 'CANCELLED');
    const noShowReservations = reservationsInRange.filter((r) => r.status === 'NO_SHOW');

    const doctorCounts = new Map<string, number>();
    const hourCounts = new Map<number, number>();
    for (const reservation of reservationsInRange) {
      doctorCounts.set(reservation.doctorId, (doctorCounts.get(reservation.doctorId) ?? 0) + 1);
      const hour = reservation.reservationTime.getUTCHours();
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    }

    const today = toDateOnly(now);
    const [dailyReservations, weeklyReservations, monthlyReservations] = await Promise.all([
      this.reservationRepository.countByDate(today, input.branchId),
      this.reservationRepository
        .findAllInDateRange(startOfWeek(now), endOfWeek(now), input.branchId)
        .then((rows) => rows.length),
      this.reservationRepository
        .findAllInDateRange(startOfMonth(now), endOfMonth(now), input.branchId)
        .then((rows) => rows.length),
    ]);

    return {
      dateRange: { from: dateFrom.toISOString().slice(0, 10), to: dateTo.toISOString().slice(0, 10) },
      reservationTrend: groupByDate(reservationsInRange),
      peakHourAnalysis: [...hourCounts.entries()].sort(([a], [b]) => a - b).map(([hour, count]) => ({ hour, count })),
      doctorUtilization: [...doctorCounts.entries()].map(([doctorId, count]) => ({ doctorId, count })),
      appointmentConversion: {
        totalCount,
        completedCount,
        conversionRate: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 1000) / 1000,
      },
      walkinRatio: {
        walkinCount,
        totalCount,
        ratio: totalCount === 0 ? 0 : Math.round((walkinCount / totalCount) * 1000) / 1000,
      },
      cancellationTrend: groupByDate(cancelledReservations),
      noShowTrend: groupByDate(noShowReservations),
      kpi: { totalReservations: totalCount, dailyReservations, weeklyReservations, monthlyReservations },
    };
  }
}
