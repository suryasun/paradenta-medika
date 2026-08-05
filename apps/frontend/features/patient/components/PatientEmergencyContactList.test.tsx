import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PatientEmergencyContactList } from "./PatientEmergencyContactList";
import { patientEmergencyContactService } from "../services/patientEmergencyContact.service";
import { useAuthStore } from "@/stores/auth.store";
import { PatientEmergencyContact } from "../types/patient.types";

jest.mock("../services/patientEmergencyContact.service");
const mockedService = jest.mocked(patientEmergencyContactService);

function renderList() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <PatientEmergencyContactList patientId="p1" />
    </QueryClientProvider>,
  );
}

function buildContact(overrides: Partial<PatientEmergencyContact> = {}): PatientEmergencyContact {
  return {
    id: "c1",
    patientId: "p1",
    contactName: "Jane Doe",
    relationship: "Spouse",
    phone: "0899988877",
    address: "Jl. Kontak No. 5",
    ...overrides,
  };
}

describe("PatientEmergencyContactList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "staff", email: "staff@example.com" },
      role: "REGISTRATION",
      roles: ["REGISTRATION"],
      permissions: ["patient.update"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows an empty state when the patient has no emergency contacts", async () => {
    mockedService.list.mockResolvedValue([]);

    renderList();

    expect(await screen.findByText("No emergency contacts yet")).toBeInTheDocument();
  });

  it("renders a contact card with name, relationship, phone, and address", async () => {
    mockedService.list.mockResolvedValue([buildContact()]);

    renderList();

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Spouse · 0899988877")).toBeInTheDocument();
    expect(screen.getByText("Jl. Kontak No. 5")).toBeInTheDocument();
  });

  it("adds a new emergency contact with the required fields", async () => {
    const user = userEvent.setup();
    mockedService.list.mockResolvedValue([]);
    mockedService.add.mockResolvedValue(buildContact());

    renderList();
    await screen.findByText("No emergency contacts yet");

    await user.click(screen.getByRole("button", { name: "Add Emergency Contact" }));
    await user.type(screen.getByLabelText("Name"), "Jane Doe");
    await user.type(screen.getByLabelText("Relationship"), "Spouse");
    await user.type(screen.getByLabelText("Phone"), "0899988877");
    await user.click(screen.getByRole("button", { name: "Add Contact" }));

    await waitFor(() =>
      expect(mockedService.add).toHaveBeenCalledWith("p1", {
        contactName: "Jane Doe",
        relationship: "Spouse",
        phone: "0899988877",
        address: undefined,
      }),
    );
  });

  it("deletes an emergency contact", async () => {
    const user = userEvent.setup();
    mockedService.list.mockResolvedValue([buildContact()]);
    mockedService.remove.mockResolvedValue(undefined);

    renderList();
    await screen.findByText("Jane Doe");

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(mockedService.remove).toHaveBeenCalledWith("p1", "c1"));
  });
});
