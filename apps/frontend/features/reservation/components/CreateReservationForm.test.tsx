import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateReservationForm } from "./CreateReservationForm";
import { reservationService } from "../services/reservation.service";
import { doctorService } from "@/features/master-data/services/doctor.service";
import { patientService } from "@/features/patient/services/patient.service";

jest.mock("../services/reservation.service");
jest.mock("@/features/master-data/services/doctor.service");
jest.mock("@/features/patient/services/patient.service");
const mockedReservationService = jest.mocked(reservationService);
const mockedDoctorService = jest.mocked(doctorService);
const mockedPatientService = jest.mocked(patientService);

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderForm() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateReservationForm />
    </QueryClientProvider>,
  );
}

describe("CreateReservationForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDoctorService.list.mockResolvedValue({
      items: [{ id: "d1", doctorCode: "DOC01", branchId: "b1", fullName: "Dr. Alice", specialization: "Orthodontics", isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    mockedPatientService.list.mockResolvedValue({
      items: [
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
      ],
      meta: { page: 1, limit: 8, total: 1, totalPages: 1 },
    });
  });

  it("registers a walk-in without requiring date/time slot selection", async () => {
    const user = userEvent.setup();
    mockedReservationService.create.mockResolvedValue({
      id: "r1",
      reservationNumber: "RSV-20260802-0001",
      status: "CHECK_IN",
      patientId: "p1",
      doctorId: "d1",
      branchId: "b1",
      scheduleId: null,
      reservationDate: "2026-08-02",
      startTime: "10:00",
      reservationType: "WALK_IN",
      reservationSource: "WALK_IN",
      complaint: null,
      notes: null,
      checkedInAt: "2026-08-02T10:00:00.000Z",
      cancelledReason: null,
      cancelledAt: null,
    });

    renderForm();
    await user.click(screen.getByRole("checkbox", { name: /walk-in/i }));

    await user.type(screen.getByLabelText("Patient"), "John");
    const patientOption = await screen.findByText(/John Doe/);
    await user.click(patientOption);

    await user.selectOptions(screen.getByLabelText("Doctor"), "d1");
    await user.click(screen.getByRole("button", { name: "Register Walk-in" }));

    await waitFor(() =>
      expect(mockedReservationService.create).toHaveBeenCalledWith(
        expect.objectContaining({ patientId: "p1", doctorId: "d1", reservationType: "WALK_IN", source: "WALK_IN" }),
      ),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/reservations/r1"));
  });

  it("disables submit until a patient and doctor are selected", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("checkbox", { name: /walk-in/i }));

    expect(screen.getByRole("button", { name: "Register Walk-in" })).toBeDisabled();
  });

  // task-289 (Epic PE6, Patient Module Enhancement addendum)
  it("lets staff Quick Add a patient when Search Patient returns no results, then selects that patient", async () => {
    const user = userEvent.setup();
    mockedPatientService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 8, total: 0, totalPages: 0 } });
    mockedPatientService.quickAdd.mockResolvedValue({
      id: "p2",
      medicalRecordNumber: "MRN000002",
      fullName: "Walk-in Patient",
      gender: "MALE",
      dateOfBirth: "1900-01-01",
      phoneNumber: "08129998877",
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

    await user.type(screen.getByLabelText("Patient"), "Nobody");
    await screen.findByText("No patients found.");
    await user.click(screen.getByRole("button", { name: "Quick Add Patient" }));

    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Full Name"), "Walk-in Patient");
    await user.type(within(dialog).getByLabelText("Address"), "Jl. Contoh No. 99");
    await user.type(within(dialog).getByLabelText("Phone Number"), "08129998877");
    await user.type(within(dialog).getByLabelText("Identity Number"), "3171000000000001");
    await user.click(within(dialog).getByRole("button", { name: "Create & Continue Booking" }));

    await waitFor(() =>
      expect(mockedPatientService.quickAdd).toHaveBeenCalledWith({
        fullName: "Walk-in Patient",
        address: "Jl. Contoh No. 99",
        phoneNumber: "08129998877",
        identityNumber: "3171000000000001",
      }),
    );
    expect(await screen.findByText(/Walk-in Patient/)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
