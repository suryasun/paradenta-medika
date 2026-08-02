import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReservationAnalyticsDashboard } from "./ReservationAnalyticsDashboard";
import { reservationService } from "../services/reservation.service";
import { doctorService } from "@/features/master-data/services/doctor.service";
import { ReservationAnalytics } from "../types/reservation.types";

jest.mock("../services/reservation.service");
jest.mock("@/features/master-data/services/doctor.service");
const mockedReservationService = jest.mocked(reservationService);
const mockedDoctorService = jest.mocked(doctorService);

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReservationAnalyticsDashboard />
    </QueryClientProvider>,
  );
}

const ANALYTICS: ReservationAnalytics = {
  dateRange: { from: "2026-07-03", to: "2026-08-02" },
  reservationTrend: [{ date: "2026-08-01", count: 3 }],
  peakHourAnalysis: [{ hour: 9, count: 2 }],
  doctorUtilization: [{ doctorId: "d1", count: 5 }],
  appointmentConversion: { totalCount: 10, completedCount: 7, conversionRate: 0.7 },
  walkinRatio: { walkinCount: 4, totalCount: 10, ratio: 0.4 },
  cancellationTrend: [{ date: "2026-08-01", count: 1 }],
  noShowTrend: [],
  kpi: { totalReservations: 10, dailyReservations: 2, weeklyReservations: 6, monthlyReservations: 10 },
};

describe("ReservationAnalyticsDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDoctorService.list.mockResolvedValue({
      items: [{ id: "d1", doctorCode: "DOC01", branchId: "b1", fullName: "drg. Amelia Putri", specialization: null, isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it("renders the KPI cards and metric sections from the analytics response", async () => {
    mockedReservationService.analytics.mockResolvedValue(ANALYTICS);
    renderDashboard();

    expect(await screen.findByText("Total Reservations")).toBeInTheDocument();
    expect(screen.getAllByText("10").length).toBeGreaterThan(0);
    expect(screen.getByText("70.0%")).toBeInTheDocument(); // conversion rate
    expect(screen.getByText("40.0%")).toBeInTheDocument(); // walk-in ratio
    expect(screen.getByText("drg. Amelia Putri")).toBeInTheDocument();
    expect(screen.getByText("Range: 2026-07-03 to 2026-08-02")).toBeInTheDocument();
  });

  it("shows an empty state for a metric with no data in range", async () => {
    mockedReservationService.analytics.mockResolvedValue(ANALYTICS);
    renderDashboard();

    await screen.findByText("Total Reservations");
    expect(screen.getByText("No data for this range")).toBeInTheDocument(); // noShowTrend is empty
  });
});
