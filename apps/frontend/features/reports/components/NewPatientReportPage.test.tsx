import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NewPatientReportPage } from "./NewPatientReportPage";
import { newPatientReportService } from "../services/newPatientReport.service";
import { doctorService } from "@/features/master-data/services/doctor.service";

jest.mock("../services/newPatientReport.service");
jest.mock("@/features/master-data/services/doctor.service");
const mockedNewPatientReportService = jest.mocked(newPatientReportService);
const mockedDoctorService = jest.mocked(doctorService);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <NewPatientReportPage />
    </QueryClientProvider>,
  );
}

// docs/06-tasks/task-291.md
describe("NewPatientReportPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDoctorService.list.mockResolvedValue({
      items: [{ id: "d1", doctorCode: "DOC01", branchId: "b1", fullName: "Dr. Alice", specialization: "Orthodontics", isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it("renders the summary cards and results table from a real date range", async () => {
    mockedNewPatientReportService.get.mockResolvedValue({
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
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      summary: { totalNewPatients: 12, topProcedure: "APPOINTMENT", conversionRate: 66.67 },
    });

    renderPage();

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getAllByText("APPOINTMENT").length).toBeGreaterThan(0);
    expect(screen.getByText("66.67%")).toBeInTheDocument();
    expect(screen.getByText("RSV-20260810-0001")).toBeInTheDocument();
    expect(screen.getByText("Dr. Alice")).toBeInTheDocument();
  });

  it("disables the Export action with an explanatory title, never a client-side workaround", async () => {
    mockedNewPatientReportService.get.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
      summary: { totalNewPatients: 0, topProcedure: null, conversionRate: 0 },
    });

    renderPage();

    const exportButton = screen.getByRole("button", { name: "Export" });
    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveAttribute("title", "Export isn't available yet");
  });
});
