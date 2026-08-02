import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DiagnosisSection } from "./DiagnosisSection";
import { emrService } from "../services/emr.service";

jest.mock("../services/emr.service");
const mockedEmrService = jest.mocked(emrService);

function renderSection(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <DiagnosisSection visitId="v1" diagnoses={[]} readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("DiagnosisSection", () => {
  beforeEach(() => jest.clearAllMocks());

  it("keeps Save disabled until at least one staged entry is PRIMARY", async () => {
    const user = userEvent.setup();
    renderSection();

    await user.type(screen.getByLabelText("Diagnosis Name"), "Karies dentin");
    await user.selectOptions(screen.getByLabelText("Type"), "SECONDARY");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("At least one Primary Diagnosis is required before saving.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Diagnoses" })).toBeDisabled();
  });

  it("submits the staged batch once a PRIMARY entry is present", async () => {
    const user = userEvent.setup();
    mockedEmrService.recordDiagnoses.mockResolvedValue([{ id: "dg1", diagnosisType: "PRIMARY", diagnosisName: "Karies dentin", notes: null }]);
    renderSection();

    await user.type(screen.getByLabelText("Diagnosis Name"), "Karies dentin");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Save Diagnoses" }));

    await waitFor(() =>
      expect(mockedEmrService.recordDiagnoses).toHaveBeenCalledWith("v1", [{ diagnosisType: "PRIMARY", diagnosisName: "Karies dentin" }]),
    );
  });

  it("hides the entry form when read-only", () => {
    renderSection(true);

    expect(screen.queryByLabelText("Diagnosis Name")).not.toBeInTheDocument();
  });
});
