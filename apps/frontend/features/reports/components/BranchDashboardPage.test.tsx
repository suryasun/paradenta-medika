import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchDashboardPage } from "./BranchDashboardPage";
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
      <BranchDashboardPage />
    </QueryClientProvider>,
  );
}

describe("BranchDashboardPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBranchService.list.mockResolvedValue({
      items: [{ id: "b1", clinicId: "c1", branchCode: "B1", branchName: "Downtown Branch", phone: "", email: "", address: "", timezone: "Asia/Jakarta", isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it("loads queue and billing metrics once a branch is selected", async () => {
    const user = userEvent.setup();
    mockedBranchReportsService.getDashboard.mockResolvedValue({
      scope: { branchIds: ["b1"], timezone: "Asia/Jakarta" },
      dataAsOf: "2026-08-04T00:00:00.000Z",
      freshness: "fresh",
      definitionVersion: "v1",
      queue: {
        queueSummary: { waiting: 1, called: 1, inService: 1, completed: 5, cancelled: 0, noShow: 0 },
        doctorSummary: [],
        branchSummary: { totalPatientToday: 8, averageWaitingTimeMinutes: 12, averageServiceTimeMinutes: 20, completionRate: 90 },
      },
      billing: [{ code: "billing.collection", value: 1000000, currency: "IDR" }],
    });

    renderPage();

    await screen.findByRole("option", { name: "Downtown Branch" });
    await user.selectOptions(screen.getByLabelText("Select branch"), "b1");

    expect(await screen.findByText("8")).toBeInTheDocument();
    expect(screen.getByText("Billing Collection")).toBeInTheDocument();
  });
});
