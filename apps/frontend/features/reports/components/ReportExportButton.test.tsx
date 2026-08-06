import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReportExportButton } from "./ReportExportButton";
import { reportJobService } from "../services/reports.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/reports.service");
const mockedReportJobService = jest.mocked(reportJobService);

function renderButton() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReportExportButton reportCode="branch.dashboard" permission="report.job.create" filters={{ branchIds: ["b1"] }} />
    </QueryClientProvider>,
  );
}

// Phase 4 hardening (reporting depth gap): branch.dashboard/comparison/
// performance previously had zero export capability -- this covers the
// shared "Generate & Export" -> job -> "Download CSV" flow now reused by
// BranchDashboardPage/BranchComparisonPage/BranchPerformancePage.
describe("ReportExportButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "owner1", username: "owner1", email: "owner1@example.com" },
      role: "OWNER",
      roles: ["OWNER"],
      permissions: ["report.job.create", "report.export.download"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("is hidden entirely for a requester without report.job.create", () => {
    act(() => {
      useAuthStore.getState().clearSession();
      useAuthStore.getState().setSession({
        accessToken: "t",
        refreshToken: "r",
        user: { id: "u1", username: "u1", email: "u1@example.com" },
        role: "CASHIER",
        roles: ["CASHIER"],
        permissions: [],
      });
    });
    renderButton();
    expect(screen.queryByRole("button", { name: /generate & export/i })).not.toBeInTheDocument();
  });

  it("creates a job and shows a Download CSV button once it completes", async () => {
    const user = userEvent.setup();
    mockedReportJobService.create.mockResolvedValue({
      job: { id: "job-1", status: "COMPLETED", reportName: "branch.dashboard", createdAt: "2026-08-06T00:00:00.000Z" } as never,
      artifactId: "artifact-1",
    });

    renderButton();
    await user.click(screen.getByRole("button", { name: /generate & export/i }));

    expect(await screen.findByText("COMPLETED")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /download csv/i })).toBeInTheDocument();
    expect(mockedReportJobService.create).toHaveBeenCalledWith("branch.dashboard", { filters: { branchIds: ["b1"] }, format: "csv" });
  });

  it("shows the job's error message when it fails without offering a download", async () => {
    const user = userEvent.setup();
    mockedReportJobService.create.mockResolvedValue({
      job: { id: "job-2", status: "FAILED", errorMessage: "RPT_DATASET_UNAVAILABLE", reportName: "branch.dashboard", createdAt: "2026-08-06T00:00:00.000Z" } as never,
    });

    renderButton();
    await user.click(screen.getByRole("button", { name: /generate & export/i }));

    expect(await screen.findByText("FAILED")).toBeInTheDocument();
    expect(screen.getByText("RPT_DATASET_UNAVAILABLE")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /download csv/i })).not.toBeInTheDocument();
  });
});
