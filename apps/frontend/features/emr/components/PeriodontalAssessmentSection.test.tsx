import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PeriodontalAssessmentSection } from "./PeriodontalAssessmentSection";
import { emrService } from "../services/emr.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/emr.service");
const mockedEmrService = jest.mocked(emrService);

function renderSection(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PeriodontalAssessmentSection visitId="v1" patientId="p1" doctorId="d1" readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("PeriodontalAssessmentSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "doc", email: "doc@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["emr.periodontal.create", "emr.periodontal.lock", "emr.periodontal.measurement.record", "emr.periodontal.measurement.update", "emr.periodontal.measurement.delete"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows a Start button when no assessment exists yet, and starts one", async () => {
    const user = userEvent.setup();
    mockedEmrService.createPeriodontalAssessment.mockResolvedValue({
      id: "pa1",
      visitId: "v1",
      patientId: "p1",
      doctorId: "d1",
      status: "DRAFT",
      lockedAt: null,
      lockedBy: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    mockedEmrService.getPeriodontalAssessment.mockResolvedValue({
      id: "pa1",
      visitId: "v1",
      patientId: "p1",
      doctorId: "d1",
      status: "DRAFT",
      lockedAt: null,
      lockedBy: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
      measurements: [],
    });
    renderSection();

    expect(screen.getByText("No periodontal assessment started for this visit yet")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Start Periodontal Assessment" }));

    await waitFor(() => expect(mockedEmrService.createPeriodontalAssessment).toHaveBeenCalledWith("v1", "p1", "d1"));
    expect(await screen.findByText("DRAFT")).toBeInTheDocument();
  });

  it("adds a measurement to an in-progress assessment", async () => {
    const user = userEvent.setup();
    mockedEmrService.createPeriodontalAssessment.mockResolvedValue({
      id: "pa1",
      visitId: "v1",
      patientId: "p1",
      doctorId: "d1",
      status: "DRAFT",
      lockedAt: null,
      lockedBy: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    mockedEmrService.getPeriodontalAssessment.mockResolvedValue({
      id: "pa1",
      visitId: "v1",
      patientId: "p1",
      doctorId: "d1",
      status: "DRAFT",
      lockedAt: null,
      lockedBy: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
      measurements: [],
    });
    mockedEmrService.addPeriodontalMeasurement.mockResolvedValue({
      id: "m1",
      assessmentId: "pa1",
      toothNumber: 16,
      measurementPoint: "MB",
      pocketDepth: 3,
      gingivalMargin: 0,
      cal: 3,
      bleeding: false,
      plaqueIndex: null,
      mobility: null,
      furcation: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    renderSection();
    await user.click(screen.getByRole("button", { name: "Start Periodontal Assessment" }));
    await screen.findByText("DRAFT");

    await user.type(screen.getByLabelText("Pocket Depth (mm)"), "3");
    await user.type(screen.getByLabelText("Gingival Margin (mm)"), "0");
    await user.click(screen.getByRole("button", { name: "Add Measurement" }));

    await waitFor(() =>
      expect(mockedEmrService.addPeriodontalMeasurement).toHaveBeenCalledWith("pa1", {
        toothNumber: 11,
        measurementPoint: "MB",
        pocketDepth: 3,
        gingivalMargin: 0,
        bleeding: false,
        plaqueIndex: undefined,
        mobility: undefined,
        furcation: undefined,
      }),
    );
  });

  it("hides the Lock action once the assessment is already Locked", async () => {
    const user = userEvent.setup();
    mockedEmrService.createPeriodontalAssessment.mockResolvedValue({
      id: "pa1",
      visitId: "v1",
      patientId: "p1",
      doctorId: "d1",
      status: "DRAFT",
      lockedAt: null,
      lockedBy: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    mockedEmrService.getPeriodontalAssessment.mockResolvedValue({
      id: "pa1",
      visitId: "v1",
      patientId: "p1",
      doctorId: "d1",
      status: "LOCKED",
      lockedAt: "2026-08-02T01:00:00.000Z",
      lockedBy: "u1",
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
      measurements: [],
    });
    renderSection();
    await user.click(screen.getByRole("button", { name: "Start Periodontal Assessment" }));

    expect(await screen.findByText("LOCKED")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lock Assessment" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Pocket Depth (mm)")).not.toBeInTheDocument();
  });
});
