import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { VisitWorkspace } from "./VisitWorkspace";
import { emrService } from "../services/emr.service";
import { treatmentService } from "@/features/master-data/services/treatment.service";
import { toothConditionService } from "@/features/master-data/services/toothCondition.service";
import { useAuthStore } from "@/stores/auth.store";
import { VisitDetail } from "../types/emr.types";

jest.mock("../services/emr.service");
jest.mock("@/features/master-data/services/treatment.service");
jest.mock("@/features/master-data/services/toothCondition.service");
const mockedEmrService = jest.mocked(emrService);
const mockedTreatmentService = jest.mocked(treatmentService);
const mockedToothConditionService = jest.mocked(toothConditionService);

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
    mockedToothConditionService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 1 } });
    mockedEmrService.getMedicalHistory.mockResolvedValue([]);
    mockedEmrService.getAllergies.mockResolvedValue([]);
    mockedEmrService.getCurrentOdontogram.mockResolvedValue([]);
    mockedEmrService.getTreatmentPlan.mockResolvedValue([]);
    mockedEmrService.getReferrals.mockResolvedValue([]);
    mockedEmrService.getFollowUps.mockResolvedValue([]);
    mockedEmrService.listVisitAttachments.mockResolvedValue([]);
    mockedEmrService.getPrescriptionHistory.mockResolvedValue([]);
    mockedEmrService.getPatientConsents.mockResolvedValue([]);
    mockedEmrService.getPatientMedicalCertificates.mockResolvedValue([]);
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "doc", email: "doc@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: [
        "emr.visit.close",
        "emr.soap.record",
        "emr.diagnosis.record",
        "emr.treatment.record",
        "emr.vital.record",
        "emr.medical-history.record",
        "emr.allergy.record",
        "emr.odontogram.record",
        "emr.odontogram.read",
        "emr.treatment-plan.create",
        "emr.treatment-plan.read",
        "reservation.create",
        "emr.periodontal.create",
        "emr.referral.create",
        "emr.followup.create",
        "emr.attachment.upload",
        "emr.prescription.create",
        "emr.consent.create",
        "emr.certificate.issue",
      ],
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

    await user.click(screen.getByRole("tab", { name: "Medical History" }));
    expect(screen.getByText("No medical history recorded yet")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Allergy" }));
    expect(screen.getByText("No allergies recorded yet")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Odontogram" }));
    expect(screen.getByText(/click any tooth below to record one/i)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Treatment Plan" }));
    expect(screen.getByText("No treatment plan items yet")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Periodontal" }));
    expect(screen.getByText("No periodontal assessment started for this visit yet")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Referral" }));
    expect(screen.getByText("No referrals recorded yet")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Follow Up" }));
    expect(screen.getByText("No follow ups scheduled yet")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Attachments" }));
    expect(screen.getByText("No attachments uploaded yet")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Prescription" }));
    expect(screen.getByText("No prescriptions recorded yet")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Consent" }));
    expect(screen.getByText("No consents recorded yet")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Medical Certificate" }));
    expect(screen.getByText("No medical certificates issued yet")).toBeInTheDocument();
  });

  it("shows a prominent Clinical Alert banner when the patient has a Severe allergy on record", async () => {
    mockedEmrService.detail.mockResolvedValue(buildVisit());
    mockedEmrService.getAllergies.mockResolvedValue([
      { id: "a1", patientId: "p1", visitId: null, type: "DRUG", allergen: "Penicillin", severity: "SEVERE", reaction: "Anaphylaxis", notes: null, createdAt: "2026-08-02T00:00:00.000Z", createdBy: "u1" },
    ]);

    renderWorkspace();
    await screen.findByRole("heading", { name: "Visit VIS000001" });

    expect(await screen.findByText("Clinical Alert")).toBeInTheDocument();
    expect(screen.getByText(/Penicillin/)).toBeInTheDocument();
  });

  it("does not show a Clinical Alert banner when the patient has no recorded history or allergies", async () => {
    mockedEmrService.detail.mockResolvedValue(buildVisit());

    renderWorkspace();
    await screen.findByRole("heading", { name: "Visit VIS000001" });

    expect(screen.queryByText("Clinical Alert")).not.toBeInTheDocument();
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
