import { ReservationAnalyticsUseCase } from './ReservationAnalyticsUseCase';
import { FakeReservationRepository } from '../../../../../tests/fakes/reservationFakes';
import { nextFakeUuid } from '../../../../../tests/fakes/uuid';

function seedReservation(
  repo: FakeReservationRepository,
  overrides: Partial<{ dateOffset: number; hour: number; status: string; source: string; doctorId: string; branchId: string }>,
) {
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  base.setUTCDate(base.getUTCDate() + (overrides.dateOffset ?? 0));
  const time = new Date(Date.UTC(1970, 0, 1, overrides.hour ?? 9, 0, 0));
  const id = nextFakeUuid();
  repo.reservations.set(id, {
    id,
    reservationNo: `RSV-${id}`,
    patientId: 'p1',
    doctorId: overrides.doctorId ?? 'd1',
    branchId: overrides.branchId ?? 'b1',
    scheduleId: null,
    reservationDate: base,
    reservationTime: time,
    reservationType: 'APPOINTMENT',
    complaint: null,
    notes: null,
    status: (overrides.status ?? 'BOOKED') as never,
    source: (overrides.source ?? 'PHONE') as never,
    treatmentPlanItemId: null,
    checkedInAt: null,
    cancelledReason: null,
    cancelledAt: null,
    createdAt: new Date(),
    createdBy: null,
    updatedAt: new Date(),
    updatedBy: null,
    deletedAt: null,
    deletedBy: null,
  } as never);
}

describe('ReservationAnalyticsUseCase (task-060)', () => {
  it('computes all 7 Section 34.5 metrics correctly across multiple statuses/sources', async () => {
    const repo = new FakeReservationRepository();
    seedReservation(repo, { dateOffset: 0, hour: 9, status: 'COMPLETED', source: 'PHONE', doctorId: 'd1' });
    seedReservation(repo, { dateOffset: 0, hour: 9, status: 'CANCELLED', source: 'WALK_IN', doctorId: 'd1' });
    seedReservation(repo, { dateOffset: -1, hour: 14, status: 'NO_SHOW', source: 'WHATSAPP', doctorId: 'd2' });
    seedReservation(repo, { dateOffset: -1, hour: 14, status: 'BOOKED', source: 'WALK_IN', doctorId: 'd2' });

    const useCase = new ReservationAnalyticsUseCase(repo);
    const result = await useCase.execute({});

    // Reservation Trend: 2 days, 2 reservations each.
    expect(result.reservationTrend.reduce((sum, p) => sum + p.count, 0)).toBe(4);

    // Peak Hour Analysis: hour 9 has 2, hour 14 has 2.
    const hour9 = result.peakHourAnalysis.find((p) => p.hour === 9);
    const hour14 = result.peakHourAnalysis.find((p) => p.hour === 14);
    expect(hour9?.count).toBe(2);
    expect(hour14?.count).toBe(2);

    // Doctor Utilization: d1 has 2, d2 has 2.
    const d1 = result.doctorUtilization.find((d) => d.doctorId === 'd1');
    const d2 = result.doctorUtilization.find((d) => d.doctorId === 'd2');
    expect(d1?.count).toBe(2);
    expect(d2?.count).toBe(2);

    // Appointment Conversion: 1 COMPLETED out of 4 total.
    expect(result.appointmentConversion).toEqual({ totalCount: 4, completedCount: 1, conversionRate: 0.25 });

    // Walk-in Ratio: 2 WALK_IN out of 4 total.
    expect(result.walkinRatio).toEqual({ walkinCount: 2, totalCount: 4, ratio: 0.5 });

    // Cancellation Trend / No Show Trend: 1 each.
    expect(result.cancellationTrend.reduce((sum, p) => sum + p.count, 0)).toBe(1);
    expect(result.noShowTrend.reduce((sum, p) => sum + p.count, 0)).toBe(1);
  });

  it('computes the Section 35.1 Operational KPIs (Total/Daily/Weekly/Monthly)', async () => {
    const repo = new FakeReservationRepository();
    seedReservation(repo, { dateOffset: 0, status: 'BOOKED' });
    seedReservation(repo, { dateOffset: 0, status: 'BOOKED' });

    const useCase = new ReservationAnalyticsUseCase(repo);
    const result = await useCase.execute({});

    expect(result.kpi.dailyReservations).toBe(2);
    expect(result.kpi.weeklyReservations).toBeGreaterThanOrEqual(2);
    expect(result.kpi.monthlyReservations).toBeGreaterThanOrEqual(2);
    expect(result.kpi.totalReservations).toBe(2);
  });

  it('respects a configurable date range, excluding reservations outside it', async () => {
    const repo = new FakeReservationRepository();
    seedReservation(repo, { dateOffset: 0 });
    seedReservation(repo, { dateOffset: -60 });

    const useCase = new ReservationAnalyticsUseCase(repo);
    const result = await useCase.execute({});

    // Default range is the trailing 30 days -- the -60-day reservation is excluded.
    expect(result.appointmentConversion.totalCount).toBe(1);
  });

  it('filters by branchId when provided', async () => {
    const repo = new FakeReservationRepository();
    seedReservation(repo, { dateOffset: 0, branchId: 'branch-a' });
    seedReservation(repo, { dateOffset: 0, branchId: 'branch-b' });

    const useCase = new ReservationAnalyticsUseCase(repo);
    const result = await useCase.execute({ branchId: 'branch-a' });

    expect(result.appointmentConversion.totalCount).toBe(1);
  });
});
