import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FollowUpSection } from "./FollowUpSection";
import { emrService } from "../services/emr.service";
import { doctorService } from "@/features/master-data/services/doctor.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/emr.service");
jest.mock("@/features/master-data/services/doctor.service");
const mockedEmrService = jest.mocked(emrService);
const mockedDoctorService = jest.mocked(doctorService);

function renderSection(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <FollowUpSection visitId="v1" readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("FollowUpSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEmrService.getFollowUps.mockResolvedValue([]);
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
      permissions: ["emr.followup.create"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows an empty state when no follow ups are recorded", async () => {
    renderSection();
    expect(await screen.findByText("No follow ups scheduled yet")).toBeInTheDocument();
  });

  it("submits a follow-up without auto-scheduling", async () => {
    const user = userEvent.setup();
    mockedEmrService.createFollowUp.mockResolvedValue({
      id: "fu1",
      visitId: "v1",
      patientId: "p1",
      followUpDate: "2026-09-01",
      note: null,
      priority: "MEDIUM",
      reservationId: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    renderSection();
    await screen.findByText("No follow ups scheduled yet");

    await user.type(screen.getByLabelText("Follow Up Date"), "2026-09-01");
    await user.click(screen.getByRole("button", { name: "Save Follow Up" }));

    await waitFor(() =>
      expect(mockedEmrService.createFollowUp).toHaveBeenCalledWith("v1", {
        followUpDate: "2026-09-01",
        note: undefined,
        priority: "MEDIUM",
        autoSchedule: false,
        doctorId: undefined,
        startTime: undefined,
        reservationType: undefined,
        source: undefined,
      }),
    );
  });

  it("reveals the auto-book fields when the toggle is checked", async () => {
    const user = userEvent.setup();
    renderSection();
    await screen.findByText("No follow ups scheduled yet");

    expect(screen.queryByLabelText("Doctor")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Auto-book reservation"));
    expect(screen.getByLabelText("Doctor")).toBeInTheDocument();
  });

  it("hides the entry form when read-only", async () => {
    renderSection(true);
    await screen.findByText("No follow ups scheduled yet");
    expect(screen.queryByLabelText("Follow Up Date")).not.toBeInTheDocument();
  });
});
