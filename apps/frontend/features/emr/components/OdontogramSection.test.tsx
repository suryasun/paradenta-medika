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

  it("shows an empty state when no tooth conditions are recorded", async () => {
    renderSection();
    expect(await screen.findByText("No tooth conditions recorded yet")).toBeInTheDocument();
  });

  it("submits a new tooth condition entry", async () => {
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
    await screen.findByText("No tooth conditions recorded yet");

    await user.selectOptions(screen.getByLabelText("Tooth (FDI)"), "16");
    await user.type(screen.getByLabelText("Surface (e.g. O, MO, MOD)"), "O");
    await user.selectOptions(screen.getByLabelText("Condition"), "c1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mockedEmrService.recordToothCondition).toHaveBeenCalledWith("v1", { toothNumber: 16, surface: "O", toothConditionId: "c1" }),
    );
  });

  it("lists the current state and opens a per-tooth history modal", async () => {
    const user = userEvent.setup();
    mockedEmrService.getCurrentOdontogram.mockResolvedValue([
      { id: "o1", visitId: "v1", patientId: "p1", toothNumber: 16, surface: "O", toothConditionId: "c1", note: null, createdAt: "2026-08-02T00:00:00.000Z", createdBy: "u1" },
    ]);
    mockedEmrService.getToothHistory.mockResolvedValue([
      { id: "o1", visitId: "v1", patientId: "p1", toothNumber: 16, surface: "O", toothConditionId: "c1", note: null, createdAt: "2026-08-02T00:00:00.000Z", createdBy: "u1" },
    ]);
    renderSection();

    expect(await screen.findByRole("cell", { name: "16" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Healthy" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "View History" }));
    expect(await screen.findByRole("dialog", { name: "Tooth 16 History" })).toBeInTheDocument();
    await waitFor(() => expect(mockedEmrService.getToothHistory).toHaveBeenCalledWith("p1", 16));
  });

  it("hides the entry form when read-only", async () => {
    renderSection(true);
    await screen.findByText("No tooth conditions recorded yet");
    expect(screen.queryByLabelText("Condition")).not.toBeInTheDocument();
  });
});
