import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReservationByStatusReportPage } from "./ReservationByStatusReportPage";
import { reservationByStatusReportService } from "../services/reservationByStatusReport.service";
import { doctorService } from "@/features/master-data/services/doctor.service";

jest.mock("../services/reservationByStatusReport.service");
jest.mock("@/features/master-data/services/doctor.service");
const mockedReservationByStatusReportService = jest.mocked(reservationByStatusReportService);
const mockedDoctorService = jest.mocked(doctorService);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReservationByStatusReportPage />
    </QueryClientProvider>,
  );
}

// docs/06-tasks/task-305.md (renamed from task-299.md)
describe("ReservationByStatusReportPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDoctorService.list.mockResolvedValue({
      items: [{ id: "d1", doctorCode: "DOC01", branchId: "b1", fullName: "Dr. Alice", specialization: "Orthodontics", isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it("renders the summary card, trend chart, and results table from a real date range", async () => {
    mockedReservationByStatusReportService.get.mockResolvedValue({
      items: [
        {
          id: "r1",
          reservationNumber: "RSV-20260810-0001",
          status: "COMPLETED",
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
      summary: { total: 8, trend: [{ date: "2026-08-10", count: 8 }] },
    });

    renderPage();

    expect(await screen.findByText("8")).toBeInTheDocument();
    expect(screen.getByText("Total COMPLETED")).toBeInTheDocument();
    expect(screen.getByText("RSV-20260810-0001")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("(MRN000001)")).toBeInTheDocument();
    expect(screen.getByText("Dr. Alice")).toBeInTheDocument();
  });

  it("shows an empty state on the trend chart when there is no data for the range", async () => {
    mockedReservationByStatusReportService.get.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
      summary: { total: 0, trend: [] },
    });

    renderPage();

    expect(await screen.findByText("No data for this range")).toBeInTheDocument();
  });

  it("re-queries with status=ALL when the status filter is set to All Statuses", async () => {
    mockedReservationByStatusReportService.get.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
      summary: { total: 0, trend: [] },
    });

    renderPage();
    await screen.findByText("No data for this range");

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "ALL" } });

    await screen.findByText("Total (All Statuses)");
    expect(mockedReservationByStatusReportService.get).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "ALL" }),
    );
  });
});
