import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReferralSection } from "./ReferralSection";
import { emrService } from "../services/emr.service";
import { useAuthStore } from "@/stores/auth.store";

jest.mock("../services/emr.service");
const mockedEmrService = jest.mocked(emrService);

function renderSection(readOnly = false) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReferralSection visitId="v1" readOnly={readOnly} />
    </QueryClientProvider>,
  );
}

describe("ReferralSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedEmrService.getReferrals.mockResolvedValue([]);
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "u1", username: "doc", email: "doc@example.com" },
      role: "DOCTOR",
      roles: ["DOCTOR"],
      permissions: ["emr.referral.create"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows an empty state when no referrals are recorded", async () => {
    renderSection();
    expect(await screen.findByText("No referrals recorded yet")).toBeInTheDocument();
  });

  it("submits a new referral", async () => {
    const user = userEvent.setup();
    mockedEmrService.createReferral.mockResolvedValue({
      id: "ref1",
      visitId: "v1",
      patientId: "p1",
      targetType: "LABORATORY",
      reason: "Blood test",
      note: null,
      createdAt: "2026-08-02T00:00:00.000Z",
      createdBy: "u1",
    });
    renderSection();
    await screen.findByText("No referrals recorded yet");

    await user.selectOptions(screen.getByLabelText("Refer To"), "LABORATORY");
    await user.type(screen.getByLabelText("Reason"), "Blood test");
    await user.click(screen.getByRole("button", { name: "Create Referral" }));

    await waitFor(() =>
      expect(mockedEmrService.createReferral).toHaveBeenCalledWith("v1", { targetType: "LABORATORY", reason: "Blood test", note: undefined }),
    );
  });

  it("hides the entry form when read-only", async () => {
    renderSection(true);
    await screen.findByText("No referrals recorded yet");
    expect(screen.queryByLabelText("Reason")).not.toBeInTheDocument();
  });
});
