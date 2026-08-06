import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TreatmentPlanSection } from "./TreatmentPlanSection";
import { emrService } from "../services/emr.service";
import { treatmentService } from "@/features/master-data/services/treatment.service";
import { doctorService } from "@/features/master-data/services/doctor.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/emr.service");
jest.mock("@/features/master-data/services/treatment.service");
jest.mock("@/features/master-data/services/doctor.service");
const mockedEmrService = jest.mocked(emrService);
const mockedTreatmentService = jest.mocked(treatmentService);
const mockedDoctorService = jest.mocked(doctorService);

function renderSection(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <TreatmentPlanSection visitId="v1" readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("TreatmentPlanSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEmrService.getTreatmentPlan.mockResolvedValue([]);
    mockedTreatmentService.list.mockResolvedValue({
      items: [{ id: "t1", treatmentCode: "T01", treatmentName: "Root Canal", treatmentCategoryId: "c1", durationMinute: 90, defaultPrice: 1200000, doctorFee: null, isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    mockedDoctorService.list.mockResolvedValue({
      items: [{ id: "d1", doctorCode: "DOC01", branchId: "b1", fullName: "drg. Test", specialization: null, isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "doc", email: "doc@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["emr.treatment-plan.create", "reservation.create"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows an empty state when no plan items are recorded", async () => {
    renderSection();
    expect(await screen.findByText("No treatment plan items yet")).toBeInTheDocument();
  });

  it("stages and submits a batch of treatment plan items", async () => {
    const user = userEvent.setup();
    mockedEmrService.createTreatmentPlan.mockResolvedValue([
      { id: "tp1", visitId: "v1", patientId: "p1", treatmentId: "t1", toothNumber: 16, surface: null, priority: "HIGH", estimatedCost: 1200000, estimatedDurationMinute: 90, createdAt: "2026-08-02T00:00:00.000Z", createdBy: "u1" },
    ]);
    renderSection();
    await screen.findByText("No treatment plan items yet");

    await user.selectOptions(screen.getByLabelText("Treatment"), "t1");
    await user.type(screen.getByLabelText("Tooth (FDI)"), "16");
    await user.selectOptions(screen.getByLabelText("Priority"), "HIGH");
    await user.type(screen.getByLabelText("Estimated Cost"), "1200000");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Save Treatment Plan" }));

    await waitFor(() =>
      expect(mockedEmrService.createTreatmentPlan).toHaveBeenCalledWith("v1", [
        { treatmentId: "t1", toothNumber: 16, priority: "HIGH", estimatedCost: 1200000, estimatedDurationMinute: undefined },
      ]),
    );
  });

  it("opens the Schedule This modal and converts a plan item to a reservation", async () => {
    const user = userEvent.setup();
    mockedEmrService.getTreatmentPlan.mockResolvedValue([
      { id: "tp1", visitId: "v1", patientId: "p1", treatmentId: "t1", toothNumber: 16, surface: null, priority: "HIGH", estimatedCost: 1200000, estimatedDurationMinute: 90, createdAt: "2026-08-02T00:00:00.000Z", createdBy: "u1" },
    ]);
    mockedEmrService.convertTreatmentPlanItemToReservation.mockResolvedValue({
      id: "r1",
      reservationNumber: "RSV-20260810-0001",
      status: "BOOKED",
      patientId: "p1",
      doctorId: "d1",
      branchId: "b1",
      scheduleId: null,
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
    renderSection();

    await user.click(await screen.findByRole("button", { name: "Schedule This" }));
    expect(await screen.findByRole("dialog", { name: "Schedule This Treatment" })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Doctor"), "d1");
    await user.type(screen.getByLabelText("Date"), "2026-08-10");
    await user.type(screen.getByLabelText("Time"), "09:00");
    await user.click(screen.getByRole("button", { name: "Create Reservation" }));

    await waitFor(() =>
      expect(mockedEmrService.convertTreatmentPlanItemToReservation).toHaveBeenCalledWith("tp1", {
        doctorId: "d1",
        reservationDate: "2026-08-10",
        startTime: "09:00",
        reservationType: "APPOINTMENT",
        source: "PHONE",
      }),
    );
  });

  it("hides the entry form when read-only", async () => {
    renderSection(true);
    await screen.findByText("No treatment plan items yet");
    expect(screen.queryByLabelText("Treatment")).not.toBeInTheDocument();
  });
});
