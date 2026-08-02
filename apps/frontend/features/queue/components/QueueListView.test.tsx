import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueueListView } from "./QueueListView";
import { queueService } from "../services/queue.service";
import { useAuthStore } from "@/stores/auth.store";
import { QueueEntry } from "../types/queue.types";

jest.mock("../services/queue.service");
const mockedQueueService = jest.mocked(queueService);

jest.mock("next/link", () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <QueueListView />
    </QueryClientProvider>,
  );
}

function buildQueueEntry(overrides: Partial<QueueEntry> = {}): QueueEntry {
  return {
    id: "q1",
    queueNumber: "A001",
    branchId: "b1",
    patientId: "p1",
    doctorId: "d1",
    reservationId: null,
    queueDate: "2026-08-02",
    queueType: "WALK_IN",
    priority: "NORMAL",
    status: "WAITING",
    checkedInAt: "2026-08-02T09:00:00.000Z",
    calledAt: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    notes: null,
    ...overrides,
  };
}

describe("QueueListView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "staff", email: "staff@example.com" },
      role: "REGISTRATION",
      roles: ["REGISTRATION"],
      permissions: ["queue.create", "queue.call", "queue.skip", "queue.cancel", "queue.transfer", "queue.recall", "queue.start", "queue.complete", "queue.dashboard.read"],
    });
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("shows an empty state when the queue has no entries", async () => {
    mockedQueueService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });

    renderView();

    expect(await screen.findByText("Queue is empty")).toBeInTheDocument();
  });

  it("a WAITING entry shows Call, Skip, Cancel, and Transfer but not Start/Complete/Recall", async () => {
    mockedQueueService.list.mockResolvedValue({ items: [buildQueueEntry()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });

    renderView();
    const row = (await screen.findByText("A001")).closest("tr")!;

    expect(within(row).getByRole("button", { name: "Call" })).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Skip" })).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Transfer" })).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Start" })).not.toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();
  });

  it("a CALLED entry shows Recall, Start, and Transfer but not Call/Skip/Cancel", async () => {
    mockedQueueService.list.mockResolvedValue({
      items: [buildQueueEntry({ status: "CALLED", calledAt: "2026-08-02T09:05:00.000Z" })],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    renderView();
    const row = (await screen.findByText("A001")).closest("tr")!;

    expect(within(row).getByRole("button", { name: "Recall" })).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "Transfer" })).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Call" })).not.toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Skip" })).not.toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("an IN_SERVICE entry only shows Complete", async () => {
    mockedQueueService.list.mockResolvedValue({
      items: [buildQueueEntry({ status: "IN_SERVICE", calledAt: "2026-08-02T09:05:00.000Z", startedAt: "2026-08-02T09:10:00.000Z" })],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    renderView();
    const row = (await screen.findByText("A001")).closest("tr")!;

    expect(within(row).getByRole("button", { name: "Complete" })).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Transfer" })).not.toBeInTheDocument();
  });

  it("calling a WAITING entry invokes the call endpoint", async () => {
    const user = userEvent.setup();
    mockedQueueService.list.mockResolvedValue({ items: [buildQueueEntry()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedQueueService.call.mockResolvedValue(buildQueueEntry({ status: "CALLED" }));

    renderView();
    await screen.findByText("A001");
    await user.click(screen.getByRole("button", { name: "Call" }));

    await waitFor(() => expect(mockedQueueService.call).toHaveBeenCalledWith("q1"));
  });

  it("skipping opens a modal with an optional reason and calls the skip endpoint", async () => {
    const user = userEvent.setup();
    mockedQueueService.list.mockResolvedValue({ items: [buildQueueEntry()], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedQueueService.skip.mockResolvedValue(buildQueueEntry({ status: "SKIPPED" }));

    renderView();
    await screen.findByText("A001");
    await user.click(screen.getByRole("button", { name: "Skip" }));

    const dialog = screen.getByRole("dialog", { name: "Skip Queue Entry" });
    await user.click(within(dialog).getByRole("button", { name: "Confirm Skip" }));

    await waitFor(() => expect(mockedQueueService.skip).toHaveBeenCalledWith("q1", undefined));
  });
});
