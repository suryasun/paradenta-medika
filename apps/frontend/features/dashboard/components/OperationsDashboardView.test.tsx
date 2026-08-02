import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OperationsDashboardView } from "./OperationsDashboardView";
import { dashboardService } from "../services/dashboard.service";
import { OperationsDashboard } from "../types/dashboard.types";

jest.mock("../services/dashboard.service");
const mockedDashboardService = jest.mocked(dashboardService);

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <OperationsDashboardView />
    </QueryClientProvider>,
  );
}

const SAMPLE_DASHBOARD: OperationsDashboard = {
  scope: { branchIds: [], timezone: "Asia/Jakarta" },
  dataAsOf: "2026-08-02T09:00:00.000Z",
  freshness: "fresh",
  definitionVersion: "1.0.0",
  metrics: [
    { code: "reservation.today.count", value: 12 },
    { code: "billing.collection.today", value: 4500000, currency: "IDR" },
    { code: "queue.count.WAITING", value: 3 },
    { code: "queue.count.CALLED", value: 1 },
    { code: "queue.count.IN_SERVICE", value: 1 },
    { code: "queue.count.COMPLETED", value: 8 },
    { code: "queue.count.CANCELLED", value: 0 },
    { code: "queue.count.NO_SHOW", value: 0 },
    { code: "queue.count.SKIPPED", value: 0 },
  ],
};

describe("OperationsDashboardView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows a loading state before the dashboard data resolves", () => {
    mockedDashboardService.getOperationsDashboard.mockReturnValue(new Promise(() => {}));

    renderView();

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders the reservation, collection, and per-status queue metrics once loaded", async () => {
    mockedDashboardService.getOperationsDashboard.mockResolvedValue(SAMPLE_DASHBOARD);

    renderView();

    expect(await screen.findByText("Operations Dashboard")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.tagName === "SPAN" && /Rp\s*4\.500\.000/.test(element.textContent ?? ""))).toBeInTheDocument();
    expect(screen.getByText("Waiting")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("shows an error state with a retry action when the request fails", async () => {
    mockedDashboardService.getOperationsDashboard.mockRejectedValue({
      isAxiosError: true,
      response: { data: { success: false, code: "FORBIDDEN", message: "Insufficient permission", errors: [] } },
    });

    renderView();

    expect(await screen.findByRole("alert")).toHaveTextContent("Insufficient permission");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
