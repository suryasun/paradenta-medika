import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClinicalTimelineSection } from "./ClinicalTimelineSection";
import { emrService } from "../services/emr.service";

jest.mock("../services/emr.service");
const mockedEmrService = jest.mocked(emrService);

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ClinicalTimelineSection patientId="p1" />
    </QueryClientProvider>,
  );
}

describe("ClinicalTimelineSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEmrService.getPatientTimelineSummary.mockResolvedValue({
      mostRecentVisit: null,
      activeAlerts: { medicalHistory: [], allergies: [] },
      openTreatmentPlanItems: [],
      lastPrescription: null,
    });
    mockedEmrService.getPatientTimelineEvents.mockResolvedValue([]);
    mockedEmrService.getPatientTimelineAttachments.mockResolvedValue([]);
  });

  it("shows empty states when nothing is on record", async () => {
    renderSection();
    expect(await screen.findByText("No clinical events recorded yet")).toBeInTheDocument();
    expect(screen.getByText("No attachments across any visit yet")).toBeInTheDocument();
    expect(screen.getByText("None on record")).toBeInTheDocument();
  });

  it("surfaces active allergy alerts in the summary panel", async () => {
    mockedEmrService.getPatientTimelineSummary.mockResolvedValue({
      mostRecentVisit: {
        id: "v1",
        visitNo: "VIS000001",
        reservationId: null,
        patientId: "p1",
        doctorId: "d1",
        branchId: "b1",
        queueId: "q1",
        visitDate: "2026-08-02T00:00:00.000Z",
        chiefComplaint: null,
        status: "COMPLETED",
        startedAt: null,
        finishedAt: null,
      },
      activeAlerts: {
        medicalHistory: [],
        allergies: [
          { id: "a1", patientId: "p1", visitId: null, type: "DRUG", allergen: "Penicillin", severity: "SEVERE", reaction: null, notes: null, createdAt: "2026-08-02T00:00:00.000Z", createdBy: "u1" },
        ],
      },
      openTreatmentPlanItems: [],
      lastPrescription: null,
    });

    renderSection();

    expect(await screen.findByText(/Penicillin/)).toBeInTheDocument();
    expect(screen.getByText(/VIS000001/)).toBeInTheDocument();
  });

  it("lists timeline events and re-fetches when the event-type filter changes", async () => {
    const user = userEvent.setup();
    mockedEmrService.getPatientTimelineEvents.mockImplementation(async (_patientId, eventType) => {
      if (eventType === "REFERRAL") {
        return [
          { id: "e2", eventType: "REFERRAL", visitId: "v1", title: "Referral Created: SPECIALIST", description: "Root canal", occurredAt: "2026-08-02T01:00:00.000Z", actorId: "u1" },
        ];
      }
      return [
        { id: "e1", eventType: "VISIT", visitId: "v1", title: "Visit Opened", description: null, occurredAt: "2026-08-02T00:00:00.000Z", actorId: "u1" },
      ];
    });

    renderSection();
    expect(await screen.findByText("Visit Opened")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filter by Event Type"), "REFERRAL");

    await waitFor(() => expect(mockedEmrService.getPatientTimelineEvents).toHaveBeenCalledWith("p1", "REFERRAL"));
    expect(await screen.findByText("Referral Created: SPECIALIST")).toBeInTheDocument();
  });
});
