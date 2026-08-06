import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EditReservationForm } from "./EditReservationForm";
import { reservationService } from "../services/reservation.service";
import { doctorService } from "@/features/master-data/services/doctor.service";
import { Reservation } from "../types/reservation.types";

jest.mock("../services/reservation.service");
jest.mock("@/features/master-data/services/doctor.service");
const mockedReservationService = jest.mocked(reservationService);
const mockedDoctorService = jest.mocked(doctorService);

const push = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function renderForm(reservationId = "r1") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <EditReservationForm reservationId={reservationId} />
    </QueryClientProvider>,
  );
}

const RESERVATION: Reservation = {
  id: "r1",
  reservationNumber: "RSV-20260810-0001",
  status: "BOOKED",
  patientId: "p1",
  doctorId: "d1",
  branchId: "b1",
  scheduleId: "s1",
  reservationDate: "2026-08-10",
  startTime: "09:00",
  reservationType: "APPOINTMENT",
  reservationSource: "PHONE",
  complaint: "Toothache",
  notes: null,
  checkedInAt: null,
  cancelledReason: null,
  cancelledAt: null,
  patientType: "NEW",
  patientMrn: null,
  patientFullName: null,
};

// docs/06-tasks/task-302.md
describe("EditReservationForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDoctorService.list.mockResolvedValue({
      items: [{ id: "d1", doctorCode: "DOC01", branchId: "b1", fullName: "Dr. Alice", specialization: "Orthodontics", isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    mockedReservationService.getTimeSlots.mockResolvedValue([
      { time: "09:00", capacity: 1, reserved: 0, available: 1, status: "AVAILABLE" },
      { time: "10:00", capacity: 1, reserved: 0, available: 1, status: "AVAILABLE" },
    ]);
  });

  it("pre-fills the form from the existing reservation and submits the update", async () => {
    const user = userEvent.setup();
    mockedReservationService.detail.mockResolvedValue(RESERVATION);
    mockedReservationService.update.mockResolvedValue({ ...RESERVATION, complaint: "Follow-up check" });

    renderForm();

    expect(await screen.findByDisplayValue("2026-08-10")).toBeInTheDocument();
    expect(screen.getByLabelText("Doctor")).toHaveValue("d1");
    expect(screen.getByLabelText("Complaint")).toHaveValue("Toothache");

    await user.clear(screen.getByLabelText("Complaint"));
    await user.type(screen.getByLabelText("Complaint"), "Follow-up check");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(mockedReservationService.update).toHaveBeenCalledWith(
        "r1",
        expect.objectContaining({ doctorId: "d1", reservationDate: "2026-08-10", startTime: "09:00", complaint: "Follow-up check" }),
      ),
    );
    await waitFor(() => expect(push).toHaveBeenCalledWith("/reservations/r1"));
  });

  it("shows a not-editable message instead of the form for a COMPLETED reservation", async () => {
    mockedReservationService.detail.mockResolvedValue({ ...RESERVATION, status: "COMPLETED" });

    renderForm();

    expect(await screen.findByText(/can no longer be edited/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Save Changes" })).not.toBeInTheDocument();
  });
});
