import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MasterDataTemplateDetailPage } from "./MasterDataTemplateDetailPage";
import { masterDataTemplateService } from "../services/masterDataTemplate.service";
import { clinicService } from "../services/clinic.service";
import { branchService } from "../services/branch.service";

jest.mock("../services/masterDataTemplate.service");
jest.mock("../services/clinic.service");
jest.mock("../services/branch.service");
const mockedTemplateService = jest.mocked(masterDataTemplateService);
const mockedClinicService = jest.mocked(clinicService);
const mockedBranchService = jest.mocked(branchService);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MasterDataTemplateDetailPage templateId="t1" />
    </QueryClientProvider>,
  );
}

describe("MasterDataTemplateDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedClinicService.list.mockResolvedValue({
      items: [{ id: "c1", clinicCode: "C1", clinicName: "Main Clinic", legalName: "Main Clinic PT", taxNumber: "1", ownerName: null, phone: "", email: "", address: "", isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    mockedBranchService.list.mockResolvedValue({
      items: [{ id: "b1", clinicId: "c1", branchCode: "B1", branchName: "Downtown Branch", phone: "", email: "", address: "", timezone: "Asia/Jakarta", isActive: true, mrnPrefix: null }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    mockedTemplateService.get.mockResolvedValue({
      id: "t1",
      entityType: "TREATMENT",
      templatePayload: { name: "Cleaning" },
      version: 3,
      ownerClinicId: "c1",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-01T00:00:00.000Z",
    });
  });

  it("shows the template payload and version", async () => {
    mockedTemplateService.getDrift.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByRole("heading", { name: "TREATMENT" })).toBeInTheDocument();
    expect(screen.getByText(/Version 3/)).toBeInTheDocument();
    expect(screen.getByText(/Cleaning/)).toBeInTheDocument();
  });

  it("shows the drift report for pushed branches", async () => {
    mockedTemplateService.getDrift.mockResolvedValue([
      { branchId: "b1", pushedVersion: 2, isStale: true, fieldDrifts: [{ field: "name", pushedValue: "Cleaning", currentValue: "Deep Cleaning" }] },
    ]);

    renderPage();

    expect(await screen.findByText("Downtown Branch")).toBeInTheDocument();
    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(screen.getByText("name")).toBeInTheDocument();
  });
});
