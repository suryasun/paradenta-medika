import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MasterDataTemplateListPage } from "./MasterDataTemplateListPage";
import { masterDataTemplateService } from "../services/masterDataTemplate.service";
import { clinicService } from "../services/clinic.service";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
jest.mock("../services/masterDataTemplate.service");
jest.mock("../services/clinic.service");
const mockedTemplateService = jest.mocked(masterDataTemplateService);
const mockedClinicService = jest.mocked(clinicService);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MasterDataTemplateListPage />
    </QueryClientProvider>,
  );
}

describe("MasterDataTemplateListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedClinicService.list.mockResolvedValue({
      items: [{ id: "c1", clinicCode: "C1", clinicName: "Main Clinic", legalName: "Main Clinic PT", taxNumber: "1", ownerName: null, phone: "", email: "", address: "", isActive: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
  });

  it("renders templates with their owner clinic name", async () => {
    mockedTemplateService.list.mockResolvedValue({
      items: [
        { id: "t1", entityType: "TREATMENT", templatePayload: { name: "Cleaning" }, version: 2, ownerClinicId: "c1", createdAt: "2026-08-01T00:00:00.000Z", updatedAt: "2026-08-01T00:00:00.000Z" },
      ],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });

    renderPage();

    expect(await screen.findByText("TREATMENT")).toBeInTheDocument();
    expect(screen.getByText("Main Clinic")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows an empty state when no templates exist", async () => {
    mockedTemplateService.list.mockResolvedValue({ items: [], meta: { page: 1, limit: 100, total: 0, totalPages: 0 } });

    renderPage();

    expect(await screen.findByText("No templates found")).toBeInTheDocument();
  });
});
