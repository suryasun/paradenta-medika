import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CreateReservationForm } from "./CreateReservationForm";
import { reservationService } from "../services/reservation.service";
import { doctorService } from "@/features/master-data/services/doctor.service";
import { patientService } from "@/features/patient/services/patient.service";
import { referralSourceService } from "@/features/master-data/services/referralSource.service";

jest.mock("../services/reservation.service");
jest.mock("@/features/master-data/services/doctor.service");
jest.mock("@/features/patient/services/patient.service");
jest.mock("@/features/master-data/services/referralSource.service");
const mockedReservationService = jest.mocked(reservationService);
const mockedDoctorService = jest.mocked(doctorService);
const mockedPatientService = jest.mocked(patientService);
const mockedReferralSourceService = jest.mocked(referralSourceService);

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
    mockedReferralSourceService.list.mockResolvedValue([
      { id: "rs-google", referralSourceCode: "GOOGLE", referralSourceName: "Google", requiresReferrer: false, isActive: true },
    ]);
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
          patientType: "NEW",
          firstReservationAt: null,
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
      patientType: "NEW",
      patientMrn: null,
      patientFullName: null,
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

  // task-297 (Reservation Module Addendum #2, R3): Quick Add Patient was
  // retired -- Search Patient's no-results state shows a plain message,
  // with no "Quick Add Patient" affordance (superseded by the standalone
  // "Quick Call: Create & Book Now" button, tested below).
  it("shows a plain no-results message for Search Patient, with no Quick Add Patient affordance", async () => {
    const user = userEvent.setup();
    mockedPatientService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 8, total: 0, totalPages: 0 } });

    renderForm();

    await user.type(screen.getByLabelText("Patient"), "Nobody");
    await screen.findByText("No patients found.");
    expect(screen.queryByRole("button", { name: "Quick Add Patient" })).not.toBeInTheDocument();
  });

  // task-292 (Epic RE3, Reservation Module Enhancement addendum)
  it("lets staff Quick Call a new patient (create + book in one submit) and navigates straight to the new reservation", async () => {
    const user = userEvent.setup();
    mockedReservationService.quickCall.mockResolvedValue({
      id: "r2",
      reservationNumber: "RSV-20260810-0001",
      status: "BOOKED",
      patientId: "p3",
      doctorId: "d1",
      branchId: "b1",
      scheduleId: "s1",
      reservationDate: "2026-08-10",
      startTime: "09:00",
      reservationType: "APPOINTMENT",
      reservationSource: "PHONE",
      complaint: null,
      notes: null,
      checkedInAt: null,
      cancelledReason: null,
      cancelledAt: null,
      patientType: "NEW",
      patientMrn: null,
      patientFullName: null,
    });

    mockedReservationService.getTimeSlots.mockResolvedValue([
      { time: "09:00", capacity: 1, reserved: 0, available: 1, status: "AVAILABLE" },
    ]);

    renderForm();

    await user.click(screen.getByRole("button", { name: "Quick Call: Create & Book Now" }));
    const dialog = await screen.findByRole("dialog");
    await user.type(within(dialog).getByLabelText("Full Name"), "Phone Caller");
    await user.type(within(dialog).getByLabelText("Address"), "Jl. Contoh No. 5");
    await user.type(within(dialog).getByLabelText("Phone Number"), "081200000010");
    await user.type(within(dialog).getByLabelText("Identity Number"), "3171000000009010");
    await user.selectOptions(within(dialog).getByLabelText("Doctor"), "d1");
    await user.type(within(dialog).getByLabelText("Date"), "2026-08-10");
    await user.click(await within(dialog).findByRole("button", { name: "09:00" }));
    // task-297 (Reservation Module Addendum #2, R2)
    await user.selectOptions(await within(dialog).findByLabelText("Dari mana Anda mengetahui klinik kami?"), "rs-google");
    await user.click(within(dialog).getByRole("button", { name: "Create & Book Now" }));

    await waitFor(() =>
      expect(mockedReservationService.quickCall).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Phone Caller",
          address: "Jl. Contoh No. 5",
          phoneNumber: "081200000010",
          identityNumber: "3171000000009010",
          doctorId: "d1",
          reservationDate: "2026-08-10",
          startTime: "09:00",
          referralSourceId: "rs-google",
        }),
      ),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/reservations/r2"));
  });
});
