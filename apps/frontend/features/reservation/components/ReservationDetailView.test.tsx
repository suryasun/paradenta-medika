import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReservationDetailView } from "./ReservationDetailView";
import { reservationService } from "../services/reservation.service";
import { useAuthStore } from "@/stores/auth.store";
import { Reservation } from "../types/reservation.types";

jest.mock("../services/reservation.service");
const mockedReservationService = jest.mocked(reservationService);

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReservationDetailView reservationId="r1" />
    </QueryClientProvider>,
  );
}

const RESERVATION: Reservation = {
  id: "r1",
  reservationNumber: "RSV-20260802-0001",
  status: "BOOKED",
  patientId: "p1",
  doctorId: "d1",
  branchId: "b1",
  scheduleId: null,
  reservationDate: "2026-08-05",
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

describe("ReservationDetailView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "staff", email: "staff@example.com" },
      role: "REGISTRATION",
      roles: ["REGISTRATION"],
      permissions: ["reservation.check-in", "reservation.reschedule", "reservation.cancel"],
    });
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("renders reservation details", async () => {
    mockedReservationService.detail.mockResolvedValue(RESERVATION);

    renderView();

    expect(await screen.findByRole("heading", { name: "RSV-20260802-0001" })).toBeInTheDocument();
    expect(screen.getByText("Toothache")).toBeInTheDocument();
  });

  it("cancelling requires a reason and calls the cancel endpoint", async () => {
    const user = userEvent.setup();
    mockedReservationService.detail.mockResolvedValue(RESERVATION);
    mockedReservationService.cancel.mockResolvedValue({ ...RESERVATION, status: "CANCELLED", cancelledReason: "Patient request" });

    renderView();
    await screen.findByRole("heading", { name: "RSV-20260802-0001" });

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("dialog", { name: "Cancel Reservation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm Cancellation" })).toBeDisabled();

    await user.type(screen.getByLabelText("Cancellation Reason"), "Patient request");
    await user.click(screen.getByRole("button", { name: "Confirm Cancellation" }));

    await waitFor(() => expect(mockedReservationService.cancel).toHaveBeenCalledWith("r1", "Patient request"));
  });
});
