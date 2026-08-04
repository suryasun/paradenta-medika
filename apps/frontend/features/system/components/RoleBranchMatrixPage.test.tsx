import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RoleBranchMatrixPage } from "./RoleBranchMatrixPage";
import { roleService } from "../services/role.service";

jest.mock("../services/role.service");
const mockedRoleService = jest.mocked(roleService);

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RoleBranchMatrixPage />
    </QueryClientProvider>,
  );
}

describe("RoleBranchMatrixPage", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders one row per role-branch combination", async () => {
    mockedRoleService.getBranchMatrix.mockResolvedValue([
      { roleId: "r1", roleName: "Doctor", branchId: "b1", branchName: "Downtown Branch", userCount: 4 },
      { roleId: "r1", roleName: "Doctor", branchId: "b2", branchName: "Uptown Branch", userCount: 2 },
    ]);

    renderPage();

    expect(await screen.findByText("Downtown Branch")).toBeInTheDocument();
    expect(screen.getByText("Uptown Branch")).toBeInTheDocument();
    expect(screen.getAllByText("Doctor")).toHaveLength(2);
  });

  it("shows an empty state when there are no assignments", async () => {
    mockedRoleService.getBranchMatrix.mockResolvedValue([]);

    renderPage();

    expect(await screen.findByText("No role-branch assignments found")).toBeInTheDocument();
  });
});
