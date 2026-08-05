import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PatientDetailView } from "./PatientDetailView";
import { patientService } from "../services/patient.service";
import { emrService } from "@/features/emr/services/emr.service";
import { useAuthStore } from "@/stores/auth.store";
import { PatientDetail } from "../types/patient.types";

jest.mock("../services/patient.service");
jest.mock("@/features/emr/services/emr.service");
const mockedPatientService = jest.mocked(patientService);
const mockedEmrService = jest.mocked(emrService);

jest.mock("next/link", () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

function renderView(patientId = "p1") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PatientDetailView patientId={patientId} />
    </QueryClientProvider>,
  );
}

const DETAIL: PatientDetail = {
  id: "p1",
  medicalRecordNumber: "MRN000001",
  identity: { identityType: "KTP", identityNumber: "3201xxxx" },
  profile: {
    fullName: "John Doe",
    gender: "MALE",
    dateOfBirth: "1998-08-10",
    placeOfBirth: "Jakarta",
    phoneNumber: "0812",
    email: "john@example.com",
    status: "ACTIVE",
    insuranceNumber: null,
    instagramHandle: null,
    facebookHandle: null,
    tiktokHandle: null,
    whatsappNumber: null,
    referralSourceId: null,
    referredByUserId: null,
  },
  addresses: ["Jl. Contoh No. 1"],
  emergencyContacts: [],
  visitHistory: [],
  reservationHistory: [],
  paymentHistory: [],
};

describe("PatientDetailView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "staff", email: "staff@example.com" },
      role: "REGISTRATION",
      roles: ["REGISTRATION"],
      permissions: ["patient.update", "patient.archive"],
    });
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("renders the Profile tab by default", async () => {
    mockedPatientService.detail.mockResolvedValue(DETAIL);

    renderView();

    expect(await screen.findByRole("heading", { name: "John Doe" })).toBeInTheDocument();
    expect(screen.getByText("Jakarta")).toBeInTheDocument();
  });

  it("shows the task-284 Kontak Tambahan fields on the Profile tab and edits one inline", async () => {
    const user = userEvent.setup();
    mockedPatientService.detail.mockResolvedValue({
      ...DETAIL,
      profile: { ...DETAIL.profile, insuranceNumber: "INS-001", whatsappNumber: "0812" },
    });
    mockedPatientService.update.mockResolvedValue({
      id: "p1",
      medicalRecordNumber: "MRN000001",
      fullName: "John Doe",
      gender: "MALE",
      dateOfBirth: "1998-08-10",
      phoneNumber: "0812",
      status: "ACTIVE",
      insuranceNumber: "INS-002",
      instagramHandle: null,
      facebookHandle: null,
      tiktokHandle: null,
      whatsappNumber: "0812",
      referralSourceId: null,
      referredByUserId: null,
    });

    renderView();
    await screen.findByRole("heading", { name: "John Doe" });

    expect(screen.getByText("Kontak Tambahan")).toBeInTheDocument();
    expect(screen.getByText("INS-001")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit Insurance Number" }));
    const input = screen.getByLabelText("Insurance Number");
    await user.clear(input);
    await user.type(input, "INS-002");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(mockedPatientService.update).toHaveBeenCalledWith("p1", { insuranceNumber: "INS-002" }));
  });

  it("switches to the Identity tab and shows history tabs as empty", async () => {
    const user = userEvent.setup();
    mockedPatientService.detail.mockResolvedValue(DETAIL);

    renderView();
    await screen.findByRole("heading", { name: "John Doe" });

    await user.click(screen.getByRole("tab", { name: "Identity" }));
    expect(screen.getByText("3201xxxx")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Reservation History" }));
    expect(screen.getByText("No reservation history")).toBeInTheDocument();
  });

  it("switches to the Clinical Timeline tab and shows the aggregated feed as empty", async () => {
    const user = userEvent.setup();
    mockedPatientService.detail.mockResolvedValue(DETAIL);
    mockedEmrService.getPatientTimelineSummary.mockResolvedValue({
      mostRecentVisit: null,
      activeAlerts: { medicalHistory: [], allergies: [] },
      openTreatmentPlanItems: [],
      lastPrescription: null,
    });
    mockedEmrService.getPatientTimelineEvents.mockResolvedValue([]);
    mockedEmrService.getPatientTimelineAttachments.mockResolvedValue([]);

    renderView();
    await screen.findByRole("heading", { name: "John Doe" });

    await user.click(screen.getByRole("tab", { name: "Clinical Timeline" }));
    expect(await screen.findByText("No clinical events recorded yet")).toBeInTheDocument();
    expect(screen.getByText("No attachments across any visit yet")).toBeInTheDocument();
  });

  it("edits the phone number inline on the Profile tab", async () => {
    const user = userEvent.setup();
    mockedPatientService.detail.mockResolvedValue(DETAIL);
    mockedPatientService.update.mockResolvedValue({
      id: "p1",
      medicalRecordNumber: "MRN000001",
      fullName: "John Doe",
      gender: "MALE",
      dateOfBirth: "1998-08-10",
      phoneNumber: "0899",
      status: "ACTIVE",
      insuranceNumber: null,
      instagramHandle: null,
      facebookHandle: null,
      tiktokHandle: null,
      whatsappNumber: null,
      referralSourceId: null,
      referredByUserId: null,
    });

    renderView();
    await screen.findByRole("heading", { name: "John Doe" });

    await user.click(screen.getByRole("button", { name: "Edit Phone" }));
    const input = screen.getByLabelText("Phone");
    await user.clear(input);
    await user.type(input, "0899");
    await user.keyboard("{Enter}");

    await waitFor(() => expect(mockedPatientService.update).toHaveBeenCalledWith("p1", { phoneNumber: "0899" }));
  });

  it("archiving from the detail page calls the archive endpoint", async () => {
    const user = userEvent.setup();
    mockedPatientService.detail.mockResolvedValue(DETAIL);
    mockedPatientService.archive.mockResolvedValue({
      id: "p1",
      medicalRecordNumber: "MRN000001",
      fullName: "John Doe",
      gender: "MALE",
      dateOfBirth: "1998-08-10",
      phoneNumber: "0812",
      status: "ARCHIVED",
      insuranceNumber: null,
      instagramHandle: null,
      facebookHandle: null,
      tiktokHandle: null,
      whatsappNumber: null,
      referralSourceId: null,
      referredByUserId: null,
    });

    renderView();
    await screen.findByRole("heading", { name: "John Doe" });
    await user.click(screen.getByRole("button", { name: "Archive" }));

    await waitFor(() => expect(mockedPatientService.archive).toHaveBeenCalledWith("p1"));
  });
});
