export interface DateCountPoint {
  date: string;
  count: number;
}

export interface HourCountPoint {
  hour: number;
  count: number;
}

export interface DoctorUtilizationEntry {
  doctorId: string;
  count: number;
}

export interface ReservationAnalyticsResponseDto {
  dateRange: { from: string; to: string };

  // docs/03-sad/13-module-reservation.md Section 34.5 -- 7 metrics, literal.
  reservationTrend: DateCountPoint[];
  peakHourAnalysis: HourCountPoint[];
  doctorUtilization: DoctorUtilizationEntry[];
  appointmentConversion: { totalCount: number; completedCount: number; conversionRate: number };
  walkinRatio: { walkinCount: number; totalCount: number; ratio: number };
  cancellationTrend: DateCountPoint[];
  noShowTrend: DateCountPoint[];

  // Section 35.1 Operational KPI -- literal 4 KPIs (AC narrows scope to
  // this subset, not the fuller 35.2/35.3/35.4 lists).
  kpi: {
    totalReservations: number;
    dailyReservations: number;
    weeklyReservations: number;
    monthlyReservations: number;
  };
}
