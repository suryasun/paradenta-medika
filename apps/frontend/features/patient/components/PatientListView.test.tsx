import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PatientListView } from "./PatientListView";
import { patientService } from "../services/patient.service";
import { useAuthStore } from "@/stores/auth.store";
import { Patient } from "../types/patient.types";

jest.mock("../services/patient.service");
const mockedPatientService = jest.mocked(patientService);

jest.mock("next/link", () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PatientListView />
    </QueryClientProvider>,
  );
}

const PATIENTS: Patient[] = [
  {
    id: "p1",
    medicalRecordNumber: "MRN000001",
    fullName: "John Doe",
    gender: "MALE",
    dateOfBirth: "1998-08-10",
    phoneNumber: "0812",
    status: "ACTIVE",
    insuranceNumber: null,
    instagramHandle: null,
    facebookHandle: null,
    tiktokHandle: null,
    whatsappNumber: null,
    referralSourceId: null,
    referredByUserId: null,
  },
];

describe("PatientListView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "staff", email: "staff@example.com" },
      role: "REGISTRATION",
      roles: ["REGISTRATION"],
      permissions: ["patient.create", "patient.update", "patient.archive"],
    });
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("shows an empty state when there are no patients", async () => {
    mockedPatientService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });

    renderView();

    expect(await screen.findByText("No patients found")).toBeInTheDocument();
  });

  it("renders patient rows with MRN, name, and status once loaded", async () => {
    mockedPatientService.list.mockResolvedValue({ items: PATIENTS, meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });

    renderView();

    expect(await screen.findByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("MRN000001")).toBeInTheDocument();
    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("archiving an active patient calls the archive endpoint", async () => {
    const user = userEvent.setup();
    mockedPatientService.list.mockResolvedValue({ items: PATIENTS, meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedPatientService.archive.mockResolvedValue({ ...PATIENTS[0], status: "ARCHIVED" });

    renderView();
    await screen.findByText("John Doe");
    await user.click(screen.getByRole("button", { name: "Archive" }));

    await waitFor(() => expect(mockedPatientService.archive).toHaveBeenCalledWith("p1"));
  });

  it("typing in search re-queries with the search term", async () => {
    const user = userEvent.setup();
    mockedPatientService.list.mockResolvedValue({ items: PATIENTS, meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });

    renderView();
    await screen.findByText("John Doe");
    await user.type(screen.getByPlaceholderText("Search name, phone, MRN..."), "John");

    await waitFor(() => expect(mockedPatientService.list).toHaveBeenCalledWith(expect.objectContaining({ search: "John" })));
  });
});
