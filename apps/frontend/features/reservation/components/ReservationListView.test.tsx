import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReservationListView } from "./ReservationListView";
import { reservationService } from "../services/reservation.service";
import { useAuthStore } from "@/stores/auth.store";
import { Reservation } from "../types/reservation.types";

jest.mock("../services/reservation.service");
const mockedReservationService = jest.mocked(reservationService);

jest.mock("next/link", () => {
  return function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  };
});

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReservationListView />
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
};

describe("ReservationListView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "staff", email: "staff@example.com" },
      role: "REGISTRATION",
      roles: ["REGISTRATION"],
      permissions: ["reservation.create", "reservation.check-in"],
    });
  });

  afterEach(() => {
    useAuthStore.getState().clearSession();
  });

  it("shows an empty state when there are no reservations", async () => {
    mockedReservationService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });

    renderView();

    expect(await screen.findByText("No reservations found")).toBeInTheDocument();
  });

  it("renders reservation rows with number, date, and status", async () => {
    mockedReservationService.list.mockResolvedValue({ items: [RESERVATION], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });

    renderView();

    expect(await screen.findByText("RSV-20260802-0001")).toBeInTheDocument();
    expect(screen.getByText("2026-08-05")).toBeInTheDocument();
    expect(screen.getByText("BOOKED", { selector: "span" })).toBeInTheDocument();
  });

  it("checking in a BOOKED reservation calls the check-in endpoint", async () => {
    const user = userEvent.setup();
    mockedReservationService.list.mockResolvedValue({ items: [RESERVATION], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });
    mockedReservationService.checkIn.mockResolvedValue({ ...RESERVATION, status: "CHECK_IN" });

    renderView();
    await screen.findByText("RSV-20260802-0001");
    await user.click(screen.getByRole("button", { name: "Check In" }));

    await waitFor(() => expect(mockedReservationService.checkIn).toHaveBeenCalledWith("r1"));
  });
});
