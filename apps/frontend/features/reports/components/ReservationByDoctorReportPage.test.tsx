import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReservationByDoctorReportPage } from "./ReservationByDoctorReportPage";
import { reservationByDoctorReportService } from "../services/reservationByDoctorReport.service";
import { doctorService } from "@/features/master-data/services/doctor.service";

jest.mock("../services/reservationByDoctorReport.service");
jest.mock("@/features/master-data/services/doctor.service");
const mockedService = jest.mocked(reservationByDoctorReportService);
const mockedDoctorService = jest.mocked(doctorService);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReservationByDoctorReportPage />
    </QueryClientProvider>,
  );
}

// docs/06-tasks/task-301.md
describe("ReservationByDoctorReportPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDoctorService.list.mockResolvedValue({
      items: [
        { id: "d1", doctorCode: "DOC01", branchId: "b1", fullName: "Dr. Alice", specialization: "Orthodontics", isActive: true },
        { id: "d2", doctorCode: "DOC02", branchId: "b1", fullName: "Dr. Bob", specialization: "General", isActive: true },
      ],
      meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });
  });

  it("renders the total-doctors card, per-doctor comparison chart with resolved names, and results table", async () => {
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
      summary: { totalDoctors: 2, breakdown: [{ doctorId: "d1", count: 3 }, { doctorId: "d2", count: 1 }] },
    });

    renderPage();

    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(screen.getByText("RSV-20260810-0001")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getAllByText("Dr. Alice").length).toBeGreaterThan(0);
  });

  it("narrows the query when a specific doctor is selected", async () => {
    const user = userEvent.setup();
    mockedService.get.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
      summary: { totalDoctors: 0, breakdown: [] },
    });

    renderPage();
    await screen.findByRole("option", { name: "Dr. Alice" });
    await user.selectOptions(screen.getByLabelText("Doctor"), "d1");

    expect(mockedService.get).toHaveBeenLastCalledWith(expect.objectContaining({ doctorId: "d1" }));
  });
});
