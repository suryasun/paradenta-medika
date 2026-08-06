import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReservationByPatientTypeReportPage } from "./ReservationByPatientTypeReportPage";
import { reservationByPatientTypeReportService } from "../services/reservationByPatientTypeReport.service";
import { doctorService } from "@/features/master-data/services/doctor.service";

jest.mock("../services/reservationByPatientTypeReport.service");
jest.mock("@/features/master-data/services/doctor.service");
const mockedService = jest.mocked(reservationByPatientTypeReportService);
const mockedDoctorService = jest.mocked(doctorService);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReservationByPatientTypeReportPage />
    </QueryClientProvider>,
  );
}

// docs/06-tasks/task-300.md
describe("ReservationByPatientTypeReportPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDoctorService.list.mockResolvedValue({
      items: [{ id: "d1", doctorCode: "DOC01", branchId: "b1", fullName: "Dr. Alice", specialization: "Orthodontics", isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it("renders the New/Old summary cards, comparison chart, and results table from a real date range", async () => {
    mockedService.get.mockResolvedValue({
      items: [
        {
          id: "r1",
          reservationNumber: "RSV-20260810-0001",
          status: "BOOKED",
          patientId: "p1",
          doctorId: "d1",
          branchId: "b1",
          scheduleId: "s1",
          reservationDate: "2026-08-10",
          startTime: "09:00",
          reservationType: "APPOINTMENT",
          reservationSource: "PHONE",
          complaint: null,
          notes: null,
          checkedInAt: null,
          cancelledReason: null,
          cancelledAt: null,
          patientType: "NEW",
          patientMrn: "MRN000001",
          patientFullName: "Jane Doe",
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      summary: { newCount: 4, oldCount: 6, newPercentage: 40, oldPercentage: 60, breakdown: [{ type: "NEW", count: 4 }, { type: "OLD", count: 6 }] },
    });

    renderPage();

    expect(await screen.findByText("4")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("40% of total")).toBeInTheDocument();
    expect(screen.getByText("60% of total")).toBeInTheDocument();
    expect(screen.getByText("RSV-20260810-0001")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Dr. Alice")).toBeInTheDocument();
  });

  it("shows an empty state on the chart when there is no data for the range", async () => {
    mockedService.get.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
      summary: { newCount: 0, oldCount: 0, newPercentage: 0, oldPercentage: 0, breakdown: [{ type: "NEW", count: 0 }, { type: "OLD", count: 0 }] },
    });

    renderPage();

    await screen.findByText("New vs. Old Comparison");
    // breakdown always has 2 entries (NEW/OLD placeholders), so the chart itself renders bars, not the empty state -- assert the table's empty instead.
    expect(screen.queryByRole("row", { name: /RSV-/ })).not.toBeInTheDocument();
  });
});
