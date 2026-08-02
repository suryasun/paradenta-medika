import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SoapNoteSection } from "./SoapNoteSection";
import { emrService } from "../services/emr.service";

jest.mock("../services/emr.service");
const mockedEmrService = jest.mocked(emrService);

function renderSection(soapNote: { subjective: string | null; objective: string | null; assessment: string | null; plan: string | null } | null) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <SoapNoteSection visitId="v1" soapNote={soapNote} readOnly={false} />
    </QueryClientProvider>,
  );
}

describe("SoapNoteSection", () => {
  beforeEach(() => jest.clearAllMocks());

  it("submits all four fields together, including unchanged ones, to avoid wiping them", async () => {
    const user = userEvent.setup();
    mockedEmrService.saveSoapNote.mockResolvedValue({ subjective: "Sakit gigi", objective: "Karies", assessment: "", plan: "Tambal" });

    renderSection({ subjective: "Sakit gigi", objective: "Karies", assessment: "", plan: "" });

    await user.type(screen.getByLabelText("Plan"), "Tambal");
    await user.click(screen.getByRole("button", { name: "Save SOAP Note" }));

    await waitFor(() =>
      expect(mockedEmrService.saveSoapNote).toHaveBeenCalledWith("v1", {
        subjective: "Sakit gigi",
        objective: "Karies",
        assessment: "",
        plan: "Tambal",
      }),
    );
  });
});
