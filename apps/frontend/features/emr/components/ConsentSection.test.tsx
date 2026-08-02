import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConsentSection } from "./ConsentSection";
import { emrService } from "../services/emr.service";
import { consentTemplateService } from "@/features/master-data/services/consentTemplate.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/emr.service");
jest.mock("@/features/master-data/services/consentTemplate.service");
const mockedEmrService = jest.mocked(emrService);
const mockedConsentTemplateService = jest.mocked(consentTemplateService);

// jsdom does not implement canvas rendering; stub just enough of the 2D
// context API for the signature pad's pointer handlers to run without
// throwing, and stub toDataURL so "Sign" can be tested end-to-end.
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    clearRect: jest.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = jest.fn(() => "data:image/png;base64,fake-signature");
});

function renderSection(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ConsentSection visitId="v1" patientId="p1" readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("ConsentSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEmrService.getPatientConsents.mockResolvedValue([]);
    mockedConsentTemplateService.list.mockResolvedValue({
      items: [{ id: "t1", category: "CLINICAL", title: "Filling Consent", body: "Body text", isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "doc", email: "doc@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["emr.consent.create", "emr.consent.sign"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows an empty state when no consents are recorded", async () => {
    renderSection();
    expect(await screen.findByText("No consents recorded yet")).toBeInTheDocument();
  });

  it("creates a new consent from a template", async () => {
    const user = userEvent.setup();
    mockedEmrService.createConsent.mockResolvedValue({
      id: "c1",
      templateId: "t1",
      patientId: "p1",
      visitId: "v1",
      doctorId: "d1",
      procedure: "Composite Filling",
      signedAt: null,
      signerName: null,
      signerRelationship: null,
      hash: null,
      signedAttachmentId: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    renderSection();
    await screen.findByText("No consents recorded yet");

    await user.selectOptions(screen.getByLabelText("Consent Template"), "t1");
    await user.type(screen.getByLabelText("Procedure"), "Composite Filling");
    await user.click(screen.getByRole("button", { name: "Create Consent" }));

    await waitFor(() =>
      expect(mockedEmrService.createConsent).toHaveBeenCalledWith({ visitId: "v1", templateId: "t1", procedure: "Composite Filling" }),
    );
  });

  it("signs an unsigned consent via the signature pad", async () => {
    const user = userEvent.setup();
    mockedEmrService.getPatientConsents.mockResolvedValue([
      {
        id: "c1",
        templateId: "t1",
        patientId: "p1",
        visitId: "v1",
        doctorId: "d1",
        procedure: "Composite Filling",
        signedAt: null,
        signerName: null,
        signerRelationship: null,
        hash: null,
        signedAttachmentId: null,
        createdAt: "2026-08-02T00:00:00.000Z",
        createdBy: "u1",
      },
    ]);
    mockedEmrService.signConsent.mockResolvedValue({
      id: "c1",
      templateId: "t1",
      patientId: "p1",
      visitId: "v1",
      doctorId: "d1",
      procedure: "Composite Filling",
      signedAt: "2026-08-02T00:05:00.000Z",
      signerName: "John Doe",
      signerRelationship: "SELF",
      hash: "hash",
      signedAttachmentId: "att-1",
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    renderSection();

    await user.click(await screen.findByRole("button", { name: "Sign" }));
    expect(await screen.findByRole("dialog", { name: "Sign Consent" })).toBeInTheDocument();

    await user.type(screen.getByLabelText("Signer Name"), "John Doe");
    const canvas = document.querySelector("canvas")!;
    await user.pointer([
      { target: canvas, coords: { clientX: 10, clientY: 10 }, keys: "[MouseLeft>]" },
      { target: canvas, coords: { clientX: 50, clientY: 50 } },
      { keys: "[/MouseLeft]" },
    ]);
    await user.click(screen.getByRole("button", { name: "Confirm Signature" }));

    await waitFor(() =>
      expect(mockedEmrService.signConsent).toHaveBeenCalledWith("c1", {
        signerName: "John Doe",
        signerRelationship: "SELF",
        signatureData: "data:image/png;base64,fake-signature",
      }),
    );
  });

  it("hides the create form when read-only", async () => {
    renderSection(true);
    await screen.findByText("No consents recorded yet");
    expect(screen.queryByLabelText("Procedure")).not.toBeInTheDocument();
  });
});
