import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchPerformancePage } from "./BranchPerformancePage";
import { branchReportsService } from "../services/branchReports.service";
import { branchService } from "@/features/master-data/services/branch.service";

jest.mock("../services/branchReports.service");
jest.mock("@/features/master-data/services/branch.service");
const mockedBranchReportsService = jest.mocked(branchReportsService);
const mockedBranchService = jest.mocked(branchService);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BranchPerformancePage />
    </QueryClientProvider>,
  );
}

describe("BranchPerformancePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBranchService.list.mockResolvedValue({
      items: [{ id: "b1", clinicId: "c1", branchCode: "B1", branchName: "Downtown Branch", phone: "", email: "", address: "", timezone: "Asia/Jakarta", isActive: true, mrnPrefix: null }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it("renders the day-by-day performance trend once a branch is selected", async () => {
    const user = userEvent.setup();
    mockedBranchReportsService.getPerformance.mockResolvedValue([
      { date: "2026-08-01", totalPatients: 10, averageWaitingTimeMinutes: 15, completionRate: 92, doctorProductivity: [], billingCollected: 500000 },
      { date: "2026-08-02", totalPatients: 12, averageWaitingTimeMinutes: 10, completionRate: 95, doctorProductivity: [], billingCollected: 600000 },
    ]);

    renderPage();

    await screen.findByRole("option", { name: "Downtown Branch" });
    await user.selectOptions(screen.getByLabelText("Branch"), "b1");

    expect(await screen.findByText("2026-08-01")).toBeInTheDocument();
    expect(screen.getByText("2026-08-02")).toBeInTheDocument();
  });
});
