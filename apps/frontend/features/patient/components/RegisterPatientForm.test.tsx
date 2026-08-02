import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegisterPatientForm } from "./RegisterPatientForm";
import { patientService } from "../services/patient.service";

jest.mock("../services/patient.service");
const mockedPatientService = jest.mocked(patientService);

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RegisterPatientForm />
    </QueryClientProvider>,
  );
}

describe("RegisterPatientForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits the required fields and navigates to the new patient's detail page", async () => {
    const user = userEvent.setup();
    mockedPatientService.create.mockResolvedValue({
      id: "p1",
      medicalRecordNumber: "MRN000001",
      fullName: "Jane Roe",
      gender: "FEMALE",
      dateOfBirth: "2000-01-01",
      phoneNumber: "0812345",
      status: "ACTIVE",
    });

    renderForm();
    await user.type(screen.getByLabelText("Full Name"), "Jane Roe");
    await user.type(screen.getByLabelText("Phone Number"), "0812345");
    await user.selectOptions(screen.getByLabelText("Gender"), "FEMALE");
    await user.type(screen.getByLabelText("Date of Birth"), "2000-01-01");
    await user.type(screen.getByLabelText("Address"), "Jl. Contoh No. 1");
    await user.click(screen.getByRole("button", { name: "Register Patient" }));

    await waitFor(() =>
      expect(mockedPatientService.create).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: "Jane Roe", phoneNumber: "0812345", gender: "FEMALE", address: "Jl. Contoh No. 1" }),
      ),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/patients/p1"));
  });

  it("shows the backend error message when registration fails", async () => {
    const user = userEvent.setup();
    mockedPatientService.create.mockRejectedValue({
      isAxiosError: true,
      response: { data: { success: false, code: "VALIDATION_ERROR", message: "Phone number is required.", errors: [] } },
    });

    renderForm();
    await user.type(screen.getByLabelText("Full Name"), "Jane Roe");
    await user.type(screen.getByLabelText("Phone Number"), "0812345");
    await user.type(screen.getByLabelText("Date of Birth"), "2000-01-01");
    await user.type(screen.getByLabelText("Address"), "Jl. Contoh No. 1");
    await user.click(screen.getByRole("button", { name: "Register Patient" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Phone number is required.");
    expect(push).not.toHaveBeenCalled();
  });
});
