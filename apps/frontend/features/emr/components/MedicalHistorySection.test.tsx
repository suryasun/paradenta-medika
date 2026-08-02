import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MedicalHistorySection } from "./MedicalHistorySection";
import { emrService } from "../services/emr.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/emr.service");
const mockedEmrService = jest.mocked(emrService);

function renderSection(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MedicalHistorySection patientId="p1" readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("MedicalHistorySection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEmrService.getMedicalHistory.mockResolvedValue([]);
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "doc", email: "doc@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["emr.medical-history.record"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows an empty state when no history is recorded", async () => {
    renderSection();
    expect(await screen.findByText("No medical history recorded yet")).toBeInTheDocument();
  });

  it("submits a new medical history entry", async () => {
    const user = userEvent.setup();
    mockedEmrService.recordMedicalHistory.mockResolvedValue({
      id: "mh1",
      patientId: "p1",
      visitId: null,
      category: "DIABETES",
      description: "Type 2, controlled with metformin",
      isActive: true,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    renderSection();
    await screen.findByText("No medical history recorded yet");

    await user.selectOptions(screen.getByLabelText("Category"), "DIABETES");
    await user.type(screen.getByLabelText("Description"), "Type 2, controlled with metformin");
    await user.click(screen.getByRole("button", { name: "Save Medical History" }));

    await waitFor(() =>
      expect(mockedEmrService.recordMedicalHistory).toHaveBeenCalledWith("p1", {
        category: "DIABETES",
        description: "Type 2, controlled with metformin",
      }),
    );
  });

  it("hides the entry form when read-only", async () => {
    renderSection(true);
    await screen.findByText("No medical history recorded yet");
    expect(screen.queryByLabelText("Description")).not.toBeInTheDocument();
  });
});
