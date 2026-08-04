import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserDetailView } from "./UserDetailView";
import { userService } from "../services/user.service";
import { roleService } from "../services/role.service";
import { useAuthStore } from "@/stores/auth.store";
import { SystemUser } from "../types/system.types";

jest.mock("../services/user.service");
jest.mock("../services/role.service");
const mockedUserService = jest.mocked(userService);
const mockedRoleService = jest.mocked(roleService);

function renderView() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <UserDetailView userId="u1" />
    </QueryClientProvider>,
  );
}

function buildUser(overrides: Partial<SystemUser> = {}): SystemUser {
  return { id: "u1", username: "jdoe", email: "jdoe@example.com", status: "ACTIVE", lastLoginAt: null, createdAt: "2026-08-01T00:00:00.000Z", ...overrides };
}

describe("UserDetailView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRoleService.list.mockResolvedValue({
      items: [{ id: "r1", roleCode: "DOCTOR", roleName: "Doctor", description: null, isSystem: true }],
      meta: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    useAuthStore.getState().setSession({
      accessToken: "t",
      refreshToken: "r",
      user: { id: "admin1", username: "admin", email: "admin@example.com" },
      role: "ADMINISTRATOR",
      roles: ["ADMINISTRATOR"],
      permissions: ["system.user.activate", "system.user.deactivate", "system.user.manage", "system.user.role.manage", "system.user.session.revoke"],
    });
  });

  afterEach(() => useAuthStore.getState().clearSession());

  it("shows Deactivate (not Activate) for an ACTIVE user", async () => {
    mockedUserService.detail.mockResolvedValue(buildUser());

    renderView();

    expect(await screen.findByRole("button", { name: "Deactivate" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Activate" })).not.toBeInTheDocument();
  });

  it("shows Activate (not Deactivate) for an INACTIVE user", async () => {
    mockedUserService.detail.mockResolvedValue(buildUser({ status: "INACTIVE" }));

    renderView();

    expect(await screen.findByRole("button", { name: "Activate" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
  });

  it("assigns a role by checking it and saving", async () => {
    const user = userEvent.setup();
    mockedUserService.detail.mockResolvedValue(buildUser());
    mockedUserService.assignRoles.mockResolvedValue(undefined);

    renderView();
    await screen.findByRole("heading", { name: "jdoe" });

    await user.click(screen.getByLabelText("Doctor"));
    await user.click(screen.getByRole("button", { name: "Save Roles" }));

    await waitFor(() => expect(mockedUserService.assignRoles).toHaveBeenCalledWith("u1", ["r1"], undefined));
  });

  it("deactivating calls the deactivate endpoint", async () => {
    const user = userEvent.setup();
    mockedUserService.detail.mockResolvedValue(buildUser());
    mockedUserService.deactivate.mockResolvedValue(buildUser({ status: "INACTIVE" }));

    renderView();
    await user.click(await screen.findByRole("button", { name: "Deactivate" }));

    await waitFor(() => expect(mockedUserService.deactivate).toHaveBeenCalledWith("u1"));
  });

  it("pre-populates the role checkboxes from the user's current roles", async () => {
    mockedUserService.detail.mockResolvedValue(buildUser({ roleIds: ["r1"] }));

    renderView();
    await screen.findByRole("heading", { name: "jdoe" });

    expect(screen.getByLabelText("Doctor")).toBeChecked();
  });
});
