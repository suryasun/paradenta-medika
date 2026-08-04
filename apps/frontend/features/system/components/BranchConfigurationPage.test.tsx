import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchConfigurationPage } from "./BranchConfigurationPage";
import { branchConfigurationService } from "../services/branchConfiguration.service";
import { branchService } from "@/features/master-data/services/branch.service";

jest.mock("../services/branchConfiguration.service");
jest.mock("@/features/master-data/services/branch.service");
const mockedConfigService = jest.mocked(branchConfigurationService);
const mockedBranchService = jest.mocked(branchService);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BranchConfigurationPage branchId="b1" />
    </QueryClientProvider>,
  );
}

describe("BranchConfigurationPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedBranchService.get.mockResolvedValue({
      id: "b1",
      clinicId: "c1",
      branchCode: "B1",
      branchName: "Downtown Branch",
      phone: "",
      email: "",
      address: "",
      timezone: "Asia/Jakarta",
      isActive: true,
    });
  });

  it("renders configuration entries with their source badge", async () => {
    mockedConfigService.get.mockResolvedValue([
      { key: "queue.max.length", value: "50", valueType: "NUMBER", source: "BRANCH" },
      { key: "reservation.slot.minutes", value: "30", valueType: "NUMBER", source: "GLOBAL" },
    ]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "Configuration — Downtown Branch" })).toBeInTheDocument();
    expect(screen.getByText("queue.max.length")).toBeInTheDocument();
    expect(screen.getByText("BRANCH")).toBeInTheDocument();
    expect(screen.getByText("GLOBAL")).toBeInTheDocument();
  });
});
