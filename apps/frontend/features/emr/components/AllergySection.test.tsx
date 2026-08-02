import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AllergySection } from "./AllergySection";
import { emrService } from "../services/emr.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/emr.service");
const mockedEmrService = jest.mocked(emrService);

function renderSection(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AllergySection patientId="p1" readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("AllergySection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEmrService.getAllergies.mockResolvedValue([]);
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "doc", email: "doc@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["emr.allergy.record"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows an empty state when no allergies are recorded", async () => {
    renderSection();
    expect(await screen.findByText("No allergies recorded yet")).toBeInTheDocument();
  });

  it("lists a recorded allergy with its severity", async () => {
    mockedEmrService.getAllergies.mockResolvedValue([
      { id: "a1", patientId: "p1", visitId: null, type: "DRUG", allergen: "Penicillin", severity: "SEVERE", reaction: "Anaphylaxis", notes: null, createdAt: "2026-08-02T00:00:00.000Z", createdBy: "u1" },
    ]);
    renderSection();

    expect(await screen.findByText("Penicillin")).toBeInTheDocument();
    expect(screen.getByText("SEVERE")).toBeInTheDocument();
    expect(screen.getByText("Anaphylaxis")).toBeInTheDocument();
  });

  it("submits a new allergy entry", async () => {
    const user = userEvent.setup();
    mockedEmrService.recordAllergy.mockResolvedValue({
      id: "a1",
      patientId: "p1",
      visitId: null,
      type: "DRUG",
      allergen: "Penicillin",
      severity: "SEVERE",
      reaction: null,
      notes: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    renderSection();
    await screen.findByText("No allergies recorded yet");

    await user.selectOptions(screen.getByLabelText("Type"), "DRUG");
    await user.type(screen.getByLabelText("Allergen"), "Penicillin");
    await user.selectOptions(screen.getByLabelText("Severity"), "SEVERE");
    await user.click(screen.getByRole("button", { name: "Save Allergy" }));

    await waitFor(() =>
      expect(mockedEmrService.recordAllergy).toHaveBeenCalledWith("p1", {
        type: "DRUG",
        allergen: "Penicillin",
        severity: "SEVERE",
        reaction: undefined,
      }),
    );
  });

  it("hides the entry form when read-only", async () => {
    renderSection(true);
    await screen.findByText("No allergies recorded yet");
    expect(screen.queryByLabelText("Allergen")).not.toBeInTheDocument();
  });
});
