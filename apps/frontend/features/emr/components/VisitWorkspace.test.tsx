import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VisitWorkspace } from "./VisitWorkspace";
import { emrService } from "../services/emr.service";
import { treatmentService } from "@/features/master-data/services/treatment.service";
import { useAuthStore } from "@/stores/auth.store";
import { VisitDetail } from "../types/emr.types";

jest.mock("../services/emr.service");
jest.mock("@/features/master-data/services/treatment.service");
const mockedEmrService = jest.mocked(emrService);
const mockedTreatmentService = jest.mocked(treatmentService);

function renderWorkspace() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <VisitWorkspace visitId="v1" />
    </QueryClientProvider>,
  );
}

function buildVisit(overrides: Partial<VisitDetail> = {}): VisitDetail {
  return {
    id: "v1",
    visitNo: "VIS000001",
    reservationId: null,
    patientId: "p1",
    doctorId: "d1",
    branchId: "b1",
    queueId: "q1",
    visitDate: "2026-08-02",
    chiefComplaint: "Toothache",
    status: "DRAFT",
    startedAt: null,
    finishedAt: null,
    vitalSigns: [],
    soapNote: null,
    diagnoses: [],
    treatmentEntries: [],
    ...overrides,
  };
}

describe("VisitWorkspace", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedTreatmentService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 1 } });
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "doc", email: "doc@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["emr.visit.close", "emr.soap.record", "emr.diagnosis.record", "emr.treatment.record", "emr.vital.record"],
    });
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("renders the visit number, status, and chief complaint", async () => {
    mockedEmrService.detail.mockResolvedValue(buildVisit());

    renderWorkspace();

    expect(await screen.findByRole("heading", { name: "Visit VIS000001" })).toBeInTheDocument();
    expect(screen.getByText("DRAFT", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Toothache")).toBeInTheDocument();
  });

  it("switches between tabs", async () => {
    const user = userEvent.setup();
    mockedEmrService.detail.mockResolvedValue(buildVisit());

    renderWorkspace();
    await screen.findByRole("heading", { name: "Visit VIS000001" });

    await user.click(screen.getByRole("tab", { name: "SOAP Note" }));
    expect(screen.getByLabelText("Subjective")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Diagnosis" }));
    expect(screen.getByText("No diagnoses recorded yet")).toBeInTheDocument();
  });

  it("shows the backend's error when closing without minimum documentation", async () => {
    const user = userEvent.setup();
    mockedEmrService.detail.mockResolvedValue(buildVisit());
    mockedEmrService.closeVisit.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          success: false,
          code: "MINIMUM_DOCUMENTATION_NOT_MET",
          message: "Visit cannot be closed: a complete SOAP note is required; at least one Treatment entry is required",
          errors: [],
        },
      },
    });

    renderWorkspace();
    await screen.findByRole("heading", { name: "Visit VIS000001" });
    await user.click(screen.getByRole("button", { name: "Close Visit" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Visit cannot be closed");
  });

  it("hides mutation controls once the visit is COMPLETED", async () => {
    const user = userEvent.setup();
    mockedEmrService.detail.mockResolvedValue(buildVisit({ status: "COMPLETED" }));

    renderWorkspace();
    await screen.findByRole("heading", { name: "Visit VIS000001" });
    expect(screen.queryByRole("button", { name: "Close Visit" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "SOAP Note" }));
    expect(screen.getByLabelText("Subjective")).toBeDisabled();
  });
});
