import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueueDashboardView } from "./QueueDashboardView";
import { queueService } from "../services/queue.service";
import { QueueDashboard } from "../types/queue.types";

jest.mock("../services/queue.service");
const mockedQueueService = jest.mocked(queueService);

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <QueueDashboardView />
    </QueryClientProvider>,
  );
}

const DASHBOARD: QueueDashboard = {
  queueSummary: { waiting: 3, called: 1, inService: 1, completed: 10, cancelled: 1, noShow: 0 },
  doctorSummary: [{ doctorId: "d1", queueCount: 5 }],
  branchSummary: { totalPatientToday: 16, averageWaitingTimeMinutes: 12, averageServiceTimeMinutes: 20, completionRate: 0.83 },
};

describe("QueueDashboardView", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the queue status summary and branch metrics", async () => {
    mockedQueueService.dashboard.mockResolvedValue(DASHBOARD);

    renderView();

    expect(await screen.findByText("Queue Dashboard")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("83%")).toBeInTheDocument();
  });

  it("shows an empty state for doctor summary when nobody has an active queue yet", async () => {
    mockedQueueService.dashboard.mockResolvedValue({ ...DASHBOARD, doctorSummary: [] });

    renderView();

    expect(await screen.findByText("No doctor activity yet today")).toBeInTheDocument();
  });
});
