import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RolePermissionsModal } from "./RolePermissionsModal";
import { roleService } from "../services/role.service";
import { Role } from "../types/system.types";

jest.mock("../services/role.service");
const mockedRoleService = jest.mocked(roleService);

function renderModal(role: Role) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <RolePermissionsModal role={role} onClose={jest.fn()} />
    </QueryClientProvider>,
  );
}

const ROLE: Role = { id: "r1", roleCode: "CASHIER", roleName: "Cashier", description: null, isSystem: true };

describe("RolePermissionsModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRoleService.listPermissions.mockResolvedValue({
      items: [
        { id: "p1", module: "billing", permissionKey: "billing.invoice.read", permissionName: "View Invoices", description: null },
        { id: "p2", module: "billing", permissionKey: "billing.payment.create", permissionName: "Create Payments", description: null },
        { id: "p3", module: "patient", permissionKey: "patient.read", permissionName: "View Patients", description: null },
      ],
      meta: { page: 1, limit: 500, total: 3, totalPages: 1 },
    });
    mockedRoleService.getPermissionsForRole.mockResolvedValue([]);
  });

  it("groups permissions by module", async () => {
    renderModal(ROLE);

    expect(await screen.findByText("billing")).toBeInTheDocument();
    expect(screen.getByText("patient")).toBeInTheDocument();
    expect(screen.getByText("View Invoices")).toBeInTheDocument();
  });

  it("submits only the checked permission ids", async () => {
    const user = userEvent.setup();
    mockedRoleService.assignPermissions.mockResolvedValue(undefined);

    renderModal(ROLE);
    await screen.findByText("View Invoices");

    await user.click(screen.getByLabelText(/View Invoices/));
    await user.click(screen.getByLabelText(/View Patients/));
    await user.click(screen.getByRole("button", { name: "Save Permissions" }));

    await waitFor(() => expect(mockedRoleService.assignPermissions).toHaveBeenCalledWith("r1", ["p1", "p3"]));
  });

  it("pre-populates checkboxes from the role's current permission grants", async () => {
    mockedRoleService.getPermissionsForRole.mockResolvedValue([
      { id: "p2", module: "billing", permissionKey: "billing.payment.create", permissionName: "Create Payments", description: null },
    ]);

    renderModal(ROLE);
    await screen.findByText("View Invoices");

    expect(screen.getByLabelText(/Create Payments/)).toBeChecked();
    expect(screen.getByLabelText(/View Invoices/)).not.toBeChecked();
  });
});
