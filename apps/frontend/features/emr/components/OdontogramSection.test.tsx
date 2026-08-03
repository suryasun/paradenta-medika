import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OdontogramSection } from "./OdontogramSection";
import { emrService } from "../services/emr.service";
import { toothConditionService } from "@/features/master-data/services/toothCondition.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/emr.service");
jest.mock("@/features/master-data/services/toothCondition.service");
const mockedEmrService = jest.mocked(emrService);
const mockedToothConditionService = jest.mocked(toothConditionService);

function renderSection(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <OdontogramSection visitId="v1" patientId="p1" readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("OdontogramSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEmrService.getCurrentOdontogram.mockResolvedValue([]);
    mockedToothConditionService.list.mockResolvedValue({
      items: [{ id: "c1", conditionCode: "HEALTHY", conditionName: "Healthy", category: "HEALTHY", colorCode: "Green", isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "doc", email: "doc@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["emr.odontogram.record"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows the interactive chart by default, with a hint when nothing is recorded yet", async () => {
    renderSection();
    expect(await screen.findByText(/click any tooth below to record one/i)).toBeInTheDocument();
    // The chart itself always renders -- e.g. tooth 16 is selectable even with zero entries.
    expect(screen.getByRole("button", { name: "Tooth 16, No condition recorded" })).toBeInTheDocument();
  });

  it("selects a tooth and submits a new condition via the side panel", async () => {
    const user = userEvent.setup();
    mockedEmrService.recordToothCondition.mockResolvedValue({
      id: "o1",
      visitId: "v1",
      patientId: "p1",
      toothNumber: 16,
      surface: "O",
      toothConditionId: "c1",
      note: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    renderSection();
    await screen.findByRole("button", { name: "Tooth 16, No condition recorded" });

    await user.click(screen.getByRole("button", { name: "Tooth 16, No condition recorded" }));
    expect(await screen.findByRole("heading", { name: "Tooth 16" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Surface (e.g. O, MO, MOD)"), "O");
    await user.selectOptions(screen.getByLabelText("Condition"), "c1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mockedEmrService.recordToothCondition).toHaveBeenCalledWith("v1", { toothNumber: 16, surface: "O", toothConditionId: "c1" }),
    );
  });

  it("shows the tooth's current condition in its accessible name and opens per-tooth history from the panel", async () => {
    const user = userEvent.setup();
    mockedEmrService.getCurrentOdontogram.mockResolvedValue([
      { id: "o1", visitId: "v1", patientId: "p1", toothNumber: 16, surface: "O", toothConditionId: "c1", note: null, createdAt: "2026-08-02T00:00:00.000Z", createdBy: "u1" },
    ]);
    mockedEmrService.getToothHistory.mockResolvedValue([
      { id: "o1", visitId: "v1", patientId: "p1", toothNumber: 16, surface: "O", toothConditionId: "c1", note: null, createdAt: "2026-08-02T00:00:00.000Z", createdBy: "u1" },
    ]);
    renderSection();

    const tooth16 = await screen.findByRole("button", { name: "Tooth 16, Healthy" });
    await user.click(tooth16);

    await user.click(screen.getByRole("button", { name: "View History" }));
    expect(await screen.findByRole("dialog", { name: "Tooth 16 History" })).toBeInTheDocument();
    await waitFor(() => expect(mockedEmrService.getToothHistory).toHaveBeenCalledWith("p1", 16));
  });

  it("falls back to the accessible table view and shows the same data", async () => {
    const user = userEvent.setup();
    mockedEmrService.getCurrentOdontogram.mockResolvedValue([
      { id: "o1", visitId: "v1", patientId: "p1", toothNumber: 16, surface: "O", toothConditionId: "c1", note: null, createdAt: "2026-08-02T00:00:00.000Z", createdBy: "u1" },
    ]);
    renderSection();
    await screen.findByRole("button", { name: "Tooth 16, Healthy" });

    await user.click(screen.getByRole("button", { name: "View as table" }));

    expect(await screen.findByRole("cell", { name: "16" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Healthy" })).toBeInTheDocument();
  });

  it("hides the record form in the panel when read-only, but still allows viewing history", async () => {
    const user = userEvent.setup();
    renderSection(true);
    await user.click(await screen.findByRole("button", { name: "Tooth 16, No condition recorded" }));

    expect(await screen.findByRole("heading", { name: "Tooth 16" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Condition")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View History" })).toBeInTheDocument();
  });
});
