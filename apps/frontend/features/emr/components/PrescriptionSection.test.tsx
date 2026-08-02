import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrescriptionSection } from "./PrescriptionSection";
import { emrService } from "../services/emr.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/emr.service");
const mockedEmrService = jest.mocked(emrService);

function renderSection(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PrescriptionSection visitId="v1" patientId="p1" readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("PrescriptionSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEmrService.getPrescriptionHistory.mockResolvedValue([]);
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "doc", email: "doc@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["emr.prescription.create"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows an empty state when no prescriptions are recorded", async () => {
    renderSection();
    expect(await screen.findByText("No prescriptions recorded yet")).toBeInTheDocument();
  });

  it("stages and submits a batch of prescription items", async () => {
    const user = userEvent.setup();
    mockedEmrService.createPrescription.mockResolvedValue({
      id: "rx1",
      visitId: "v1",
      patientId: "p1",
      doctorId: "d1",
      items: [{ id: "i1", medicineName: "Paracetamol", dosage: "500mg", frequency: "3x daily", duration: "3 days", instruction: null }],
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    renderSection();
    await screen.findByText("No prescriptions recorded yet");

    await user.type(screen.getByLabelText("Medicine"), "Paracetamol");
    await user.type(screen.getByLabelText("Dosage"), "500mg");
    await user.type(screen.getByLabelText("Frequency"), "3x daily");
    await user.type(screen.getByLabelText("Duration"), "3 days");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Save Prescription" }));

    await waitFor(() =>
      expect(mockedEmrService.createPrescription).toHaveBeenCalledWith("v1", [
        { medicineName: "Paracetamol", dosage: "500mg", frequency: "3x daily", duration: "3 days", instruction: undefined },
      ]),
    );
  });

  it("shows the backend's allergy-conflict error when saving fails", async () => {
    const user = userEvent.setup();
    mockedEmrService.createPrescription.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          success: false,
          code: "PRESCRIPTION_ALLERGY_CONFLICT",
          message: 'Cannot prescribe "Amoxicillin": patient has a recorded Drug allergy to "Amoxicillin"',
          errors: [],
        },
      },
    });
    renderSection();
    await screen.findByText("No prescriptions recorded yet");

    await user.type(screen.getByLabelText("Medicine"), "Amoxicillin");
    await user.type(screen.getByLabelText("Dosage"), "500mg");
    await user.type(screen.getByLabelText("Frequency"), "3x daily");
    await user.type(screen.getByLabelText("Duration"), "5 days");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Save Prescription" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot prescribe");
  });

  it("hides the entry form when read-only", async () => {
    renderSection(true);
    await screen.findByText("No prescriptions recorded yet");
    expect(screen.queryByLabelText("Medicine")).not.toBeInTheDocument();
  });
});
