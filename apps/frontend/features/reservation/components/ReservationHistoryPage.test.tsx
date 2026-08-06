import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReservationHistoryPage } from "./ReservationHistoryPage";
import { reservationService } from "../services/reservation.service";
import { Reservation } from "../types/reservation.types";

jest.mock("../services/reservation.service");
const mockedReservationService = jest.mocked(reservationService);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReservationHistoryPage />
    </QueryClientProvider>,
  );
}

function buildReservation(overrides: Partial<Reservation>): Reservation {
  return {
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
    complaint: null,
    notes: null,
    checkedInAt: null,
    cancelledReason: null,
    cancelledAt: null,
    patientType: "NEW",
    ...overrides,
  };
}

// docs/06-tasks/task-294.md Testing Required
describe("ReservationHistoryPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("summary bar counts match a set of mocked reservations' statuses", async () => {
    mockedReservationService.list.mockResolvedValue({
      items: [
        buildReservation({ id: "r1", status: "COMPLETED", patientType: "NEW" }),
        buildReservation({ id: "r2", status: "COMPLETED", patientType: "OLD" }),
        buildReservation({ id: "r3", status: "CANCELLED", patientType: "OLD" }),
        buildReservation({ id: "r4", status: "NO_SHOW", patientType: "OLD" }),
      ],
      meta: { page: 1, limit: 20, total: 4, totalPages: 1 },
    });

    renderPage();

    expect(await screen.findByText(/2 completed/)).toBeInTheDocument();
    expect(screen.getByText(/2 cancelled\/no-show/)).toBeInTheDocument();
    expect(screen.getByText(/25% new patients/)).toBeInTheDocument();
  });

  it("Status/Patient Type/Date Range/Procedure filters narrow the results, individually and combined", async () => {
    const user = userEvent.setup();
    mockedReservationService.list.mockResolvedValue({ items: [buildReservation({})], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });

    renderPage();
    await screen.findByText("RSV-20260810-0001");

    const [statusSelect, patientTypeSelect, procedureSelect] = screen.getAllByRole("combobox");
    await user.selectOptions(statusSelect, "COMPLETED");
    await waitFor(() => expect(mockedReservationService.list).toHaveBeenLastCalledWith(expect.objectContaining({ status: "COMPLETED" })));

    await user.selectOptions(patientTypeSelect, "NEW");
    await waitFor(() => expect(mockedReservationService.list).toHaveBeenLastCalledWith(expect.objectContaining({ status: "COMPLETED", patientType: "NEW" })));

    await user.selectOptions(procedureSelect, "APPOINTMENT");
    await waitFor(() =>
      expect(mockedReservationService.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: "COMPLETED", patientType: "NEW", reservationType: "APPOINTMENT" }),
      ),
    );

    fireEvent.change(screen.getByLabelText("Date from"), { target: { value: "2026-08-01" } });
    await waitFor(() => expect(mockedReservationService.list).toHaveBeenLastCalledWith(expect.objectContaining({ dateFrom: "2026-08-01" })));
    fireEvent.change(screen.getByLabelText("Date to"), { target: { value: "2026-08-31" } });
    await waitFor(() => expect(mockedReservationService.list).toHaveBeenLastCalledWith(expect.objectContaining({ dateTo: "2026-08-31" })));
  });

  it("search matches by patient name or procedure text (forwarded to the backend search param)", async () => {
    const user = userEvent.setup();
    mockedReservationService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 20, total: 0, totalPages: 1 } });

    renderPage();
    await user.type(screen.getByPlaceholderText("Search patient name or procedure..."), "Jane");

    await waitFor(() => expect(mockedReservationService.list).toHaveBeenLastCalledWith(expect.objectContaining({ search: "Jane" })));
  });

  it("both card actions navigate to the same Reservation Detail route for a given reservation", async () => {
    mockedReservationService.list.mockResolvedValue({ items: [buildReservation({ id: "r42" })], meta: { page: 1, limit: 20, total: 1, totalPages: 1 } });

    renderPage();

    const detailsLink = await screen.findByRole("link", { name: "View Appointment Details" });
    const fullLink = screen.getByRole("link", { name: "View Full Reservation" });
    expect(detailsLink).toHaveAttribute("href", "/reservations/r42");
    expect(fullLink).toHaveAttribute("href", "/reservations/r42");
  });
});
