import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PatientDetailView } from "./PatientDetailView";
import { patientService } from "../services/patient.service";
import { useAuthStore } from "@/stores/auth.store";
import { PatientDetail } from "../types/patient.types";

jest.mock("../services/patient.service");
const mockedPatientService = jest.mocked(patientService);

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

  it("switches to the Identity tab and shows history tabs as empty", async () => {
    const user = userEvent.setup();
    mockedPatientService.detail.mockResolvedValue(DETAIL);

    renderView();
    await screen.findByRole("heading", { name: "John Doe" });

    await user.click(screen.getByRole("tab", { name: "Identity" }));
    expect(screen.getByText("3201xxxx")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Visit History" }));
    expect(screen.getByText("No visit history")).toBeInTheDocument();
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
    });

    renderView();
    await screen.findByRole("heading", { name: "John Doe" });
    await user.click(screen.getByRole("button", { name: "Archive" }));

    await waitFor(() => expect(mockedPatientService.archive).toHaveBeenCalledWith("p1"));
  });
});
