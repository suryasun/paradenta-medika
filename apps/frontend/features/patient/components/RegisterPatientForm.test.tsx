import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RegisterPatientForm } from "./RegisterPatientForm";
import { patientService } from "../services/patient.service";
import { referralSourceService } from "@/features/master-data/services/referralSource.service";
import { userService } from "@/features/system/services/user.service";

jest.mock("../services/patient.service");
jest.mock("@/features/master-data/services/referralSource.service");
jest.mock("@/features/system/services/user.service");
const mockedPatientService = jest.mocked(patientService);
const mockedReferralSourceService = jest.mocked(referralSourceService);
const mockedUserService = jest.mocked(userService);

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
    mockedReferralSourceService.list.mockResolvedValue([
      { id: "rs-google", referralSourceCode: "GOOGLE", referralSourceName: "Google", requiresReferrer: false, isActive: true },
      { id: "rs-staff", referralSourceCode: "STAFF", referralSourceName: "Staf Klinik", requiresReferrer: true, isActive: true },
    ]);
    mockedUserService.list.mockResolvedValue({
      items: [{ id: "u1", username: "drjane", email: "drjane@example.com", status: "ACTIVE", lastLoginAt: null, createdAt: "2026-01-01" }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
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
      insuranceNumber: null,
      instagramHandle: null,
      facebookHandle: null,
      tiktokHandle: null,
      whatsappNumber: null,
      referralSourceId: null,
      referredByUserId: null,
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

  it("shows the staff picker only when the selected referral source requires a referrer", async () => {
    const user = userEvent.setup();

    renderForm();
    await screen.findByText("Google");

    expect(screen.queryByLabelText("Staf yang merujuk")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Dari mana Anda mengetahui klinik kami?"), "rs-staff");
    expect(await screen.findByLabelText("Staf yang merujuk")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Dari mana Anda mengetahui klinik kami?"), "rs-google");
    expect(screen.queryByLabelText("Staf yang merujuk")).not.toBeInTheDocument();
  });

  it("submits the selected referralSourceId and referredByUserId together", async () => {
    const user = userEvent.setup();
    mockedPatientService.create.mockResolvedValue({
      id: "p1",
      medicalRecordNumber: "MRN000001",
      fullName: "Jane Roe",
      gender: "FEMALE",
      dateOfBirth: "2000-01-01",
      phoneNumber: "0812345",
      status: "ACTIVE",
      insuranceNumber: null,
      instagramHandle: null,
      facebookHandle: null,
      tiktokHandle: null,
      whatsappNumber: null,
      referralSourceId: "rs-staff",
      referredByUserId: "u1",
    });

    renderForm();
    await screen.findByText("Google");
    await user.type(screen.getByLabelText("Full Name"), "Jane Roe");
    await user.type(screen.getByLabelText("Phone Number"), "0812345");
    await user.type(screen.getByLabelText("Date of Birth"), "2000-01-01");
    await user.type(screen.getByLabelText("Address"), "Jl. Contoh No. 1");
    await user.selectOptions(screen.getByLabelText("Dari mana Anda mengetahui klinik kami?"), "rs-staff");
    await user.selectOptions(await screen.findByLabelText("Staf yang merujuk"), "u1");
    await user.click(screen.getByRole("button", { name: "Register Patient" }));

    await waitFor(() =>
      expect(mockedPatientService.create).toHaveBeenCalledWith(
        expect.objectContaining({ referralSourceId: "rs-staff", referredByUserId: "u1" }),
      ),
    );
  });
});
