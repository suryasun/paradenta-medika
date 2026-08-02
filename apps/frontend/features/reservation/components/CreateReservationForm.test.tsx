import { render, screen, waitFor } from "@testing-library/react";
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
      items: [{ id: "p1", medicalRecordNumber: "MRN000001", fullName: "John Doe", gender: "MALE", dateOfBirth: "1998-08-10", phoneNumber: "0812", status: "ACTIVE" }],
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
});
