import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchComparisonPage } from "./BranchComparisonPage";
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
      <BranchComparisonPage />
    </QueryClientProvider>,
  );
}

describe("BranchComparisonPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBranchService.list.mockResolvedValue({
      items: [
        { id: "b1", clinicId: "c1", branchCode: "B1", branchName: "Downtown Branch", phone: "", email: "", address: "", timezone: "Asia/Jakarta", isActive: true, mrnPrefix: null },
        { id: "b2", clinicId: "c1", branchCode: "B2", branchName: "Uptown Branch", phone: "", email: "", address: "", timezone: "Asia/Jakarta", isActive: true, mrnPrefix: null },
      ],
      meta: { page: 1, limit: 100, total: 2, totalPages: 1 },
    });
  });

  it("renders a side-by-side comparison table once branches are selected", async () => {
    const user = userEvent.setup();
    mockedBranchReportsService.getComparison.mockResolvedValue([
      { branchId: "b1", branchName: "Downtown Branch", dataAsOf: "2026-08-04T00:00:00.000Z", freshness: "fresh", metrics: [{ code: "billing.collection", value: 100 }] },
      { branchId: "b2", branchName: "Uptown Branch", dataAsOf: "2026-08-04T00:00:00.000Z", freshness: "fresh", metrics: [{ code: "billing.collection", value: 200 }] },
    ]);

    renderPage();

    await user.click(await screen.findByLabelText("Downtown Branch"));
    await user.click(screen.getByLabelText("Uptown Branch"));

    expect(await screen.findAllByText("Billing Collection")).not.toHaveLength(0);
    expect(mockedBranchReportsService.getComparison).toHaveBeenCalledWith(["b1", "b2"]);
  });
});
