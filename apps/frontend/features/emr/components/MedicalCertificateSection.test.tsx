import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MedicalCertificateSection } from "./MedicalCertificateSection";
import { emrService } from "../services/emr.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/emr.service");
const mockedEmrService = jest.mocked(emrService);

function renderSection(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MedicalCertificateSection visitId="v1" patientId="p1" readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("MedicalCertificateSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEmrService.getPatientMedicalCertificates.mockResolvedValue([]);
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "doc", email: "doc@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["emr.certificate.issue"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows an empty state when no certificates have been issued", async () => {
    renderSection();
    expect(await screen.findByText("No medical certificates issued yet")).toBeInTheDocument();
  });

  it("issues a new certificate", async () => {
    const user = userEvent.setup();
    mockedEmrService.issueMedicalCertificate.mockResolvedValue({
      id: "c1",
      certificateNumber: "MC-20260802-0001",
      visitId: "v1",
      patientId: "p1",
      doctorId: "d1",
      certificateType: "SICK_LEAVE",
      content: "Requires 3 days of rest.",
      issuedAt: "2026-08-02T00:00:00.000Z",
      attachmentId: "att-1",
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    renderSection();
    await screen.findByText("No medical certificates issued yet");

    await user.selectOptions(screen.getByLabelText("Certificate Type"), "SICK_LEAVE");
    await user.type(screen.getByLabelText("Content"), "Requires 3 days of rest.");
    await user.click(screen.getByRole("button", { name: "Issue Certificate" }));

    await waitFor(() =>
      expect(mockedEmrService.issueMedicalCertificate).toHaveBeenCalledWith("v1", {
        certificateType: "SICK_LEAVE",
        content: "Requires 3 days of rest.",
      }),
    );
  });

  it("lists issued certificates", async () => {
    mockedEmrService.getPatientMedicalCertificates.mockResolvedValue([
      {
        id: "c1",
        certificateNumber: "MC-20260802-0001",
        visitId: "v1",
        patientId: "p1",
        doctorId: "d1",
        certificateType: "FIT_TO_WORK",
        content: "Fit to work as of today.",
        issuedAt: "2026-08-02T00:00:00.000Z",
        attachmentId: "att-1",
        createdAt: "2026-08-02T00:00:00.000Z",
        createdBy: "u1",
      },
    ]);
    renderSection();

    expect(await screen.findByText("MC-20260802-0001")).toBeInTheDocument();
    expect(screen.getByText("FIT TO WORK", { selector: "td" })).toBeInTheDocument();
  });

  it("hides the issuance form when read-only", async () => {
    renderSection(true);
    await screen.findByText("No medical certificates issued yet");
    expect(screen.queryByLabelText("Content")).not.toBeInTheDocument();
  });
});
