// Mirrors apps/backend/src/modules/reservation/application/dtos/ReservationResponseDto.ts
export interface Reservation {
  id: string;
  reservationNumber: string;
  status: "BOOKED" | "CONFIRMED" | "CHECK_IN" | "IN_QUEUE" | "IN_SERVICE" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  patientId: string;
  doctorId: string;
  branchId: string;
  scheduleId: string | null;
  reservationDate: string;
  startTime: string;
  reservationType: "APPOINTMENT" | "WALK_IN" | "FOLLOW_UP" | "EMERGENCY" | "CONSULTATION";
  reservationSource: "WALK_IN" | "PHONE" | "WHATSAPP" | "WEBSITE" | "MOBILE_APP";
  complaint: string | null;
  notes: string | null;
  checkedInAt: string | null;
  cancelledReason: string | null;
  cancelledAt: string | null;
}

export interface TimeSlot {
  time: string;
  capacity: number;
  reserved: number;
  available: number;
  status: "AVAILABLE" | "FULL";
}

export interface CreateReservationInput {
  patientId: string;
  doctorId: string;
  reservationDate?: string;
  startTime?: string;
  reservationType: Reservation["reservationType"];
  source: Reservation["reservationSource"];
  complaint?: string;
  notes?: string;
}

export interface UpdateReservationInput {
  doctorId?: string;
  reservationDate?: string;
  startTime?: string;
  reservationType?: Reservation["reservationType"];
  complaint?: string;
  notes?: string;
}

// Mirrors apps/backend's ReservationAnalyticsResponseDto (docs/06-tasks/task-060.md).
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

export interface ReservationAnalytics {
  dateRange: { from: string; to: string };
  reservationTrend: DateCountPoint[];
  peakHourAnalysis: HourCountPoint[];
  doctorUtilization: DoctorUtilizationEntry[];
  appointmentConversion: { totalCount: number; completedCount: number; conversionRate: number };
  walkinRatio: { walkinCount: number; totalCount: number; ratio: number };
  cancellationTrend: DateCountPoint[];
  noShowTrend: DateCountPoint[];
  kpi: {
    totalReservations: number;
    dailyReservations: number;
    weeklyReservations: number;
    monthlyReservations: number;
  };
}

export interface ReservationAnalyticsParams {
  dateFrom?: string;
  dateTo?: string;
  branchId?: string;
}

export interface ListReservationsParams {
  page?: number;
  limit?: number;
  search?: string;
  doctorId?: string;
  status?: string;
  reservationType?: string;
  reservationSource?: string;
  dateFrom?: string;
  dateTo?: string;
}
