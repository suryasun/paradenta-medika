import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReservationCalendarPage } from "./ReservationCalendarPage";
import { reservationService } from "../services/reservation.service";
import { doctorService } from "@/features/master-data/services/doctor.service";
import { Reservation } from "../types/reservation.types";

jest.mock("../services/reservation.service");
jest.mock("@/features/master-data/services/doctor.service");
const mockedReservationService = jest.mocked(reservationService);
const mockedDoctorService = jest.mocked(doctorService);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReservationCalendarPage />
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
    patientMrn: null,
    patientFullName: null,
    ...overrides,
  };
}

// docs/06-tasks/task-293.md Testing Required
describe("ReservationCalendarPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedDoctorService.list.mockResolvedValue({
      items: [{ id: "d1", doctorCode: "DOC01", branchId: "b1", fullName: "Dr. Alice", specialization: "Orthodontics", isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it("groups reservations by date in Agenda view", async () => {
    mockedReservationService.list.mockResolvedValue({
      items: [
        buildReservation({ id: "r1", reservationDate: "2026-08-10", startTime: "09:00" }),
        buildReservation({ id: "r2", reservationDate: "2026-08-10", startTime: "14:00" }),
        buildReservation({ id: "r3", reservationDate: "2026-08-11", startTime: "10:00" }),
      ],
      meta: { page: 1, limit: 100, total: 3, totalPages: 1 },
    });

    renderPage();

    expect(await screen.findByText("2026-08-10")).toBeInTheDocument();
    expect(screen.getByText("2026-08-11")).toBeInTheDocument();
  });

  // docs/06-tasks/task-304.md (Reservation Module Addendum #3)
  it("shows the patient's name and MRN on a calendar entry", async () => {
    mockedReservationService.list.mockResolvedValue({
      items: [buildReservation({ id: "r1", patientFullName: "Jane Doe", patientMrn: "MRN000001" })],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });

    renderPage();

    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("(MRN000001)")).toBeInTheDocument();
  });

  it("renders an empty state when the selected range has zero reservations", async () => {
    mockedReservationService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 1 } });

    renderPage();

    expect(await screen.findByText("No reservations in this range.")).toBeInTheDocument();
  });

  it("preserves the currently selected date when switching Day/Week/Month/Agenda", async () => {
    const user = userEvent.setup();
    mockedReservationService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 1 } });

    renderPage();

    const dateInput = screen.getByLabelText("Selected date") as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-08-15" } });
    expect(dateInput.value).toBe("2026-08-15");

    await user.click(screen.getByRole("button", { name: "day" }));
    expect(dateInput.value).toBe("2026-08-15");
    await user.click(screen.getByRole("button", { name: "week" }));
    expect(dateInput.value).toBe("2026-08-15");
    await user.click(screen.getByRole("button", { name: "month" }));
    expect(dateInput.value).toBe("2026-08-15");
  });

  it("opens the Reservation Detail modal with the correct reservation's data when an entry is clicked", async () => {
    const user = userEvent.setup();
    mockedReservationService.list.mockResolvedValue({
      items: [buildReservation({ id: "r1", reservationNumber: "RSV-20260810-0001" })],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    mockedReservationService.detail.mockResolvedValue(buildReservation({ id: "r1", reservationNumber: "RSV-20260810-0001" }));

    renderPage();

    const entry = await screen.findByText("09:00");
    await user.click(entry);

    const dialog = await screen.findByRole("dialog");
    await waitFor(() => expect(mockedReservationService.detail).toHaveBeenCalledWith("r1"));
    expect(dialog).toHaveTextContent("RSV-20260810-0001");
  });
});
