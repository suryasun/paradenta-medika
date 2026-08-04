import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { CreateRoleInput, Permission, Role } from "../types/system.types";

// docs/06-tasks/task-017.md, task-018.md
export const roleService = {
  async list(params: { search?: string; limit?: number } = {}): Promise<{ items: Role[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<Role[]>>("/system/roles", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },

  async create(payload: CreateRoleInput): Promise<Role> {
    const response = await apiClient.post<ApiSuccessBody<Role>>("/system/roles", payload);
    return response.data.data;
  },

  async listPermissions(): Promise<{ items: Permission[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<Permission[]>>("/system/permissions", { params: { limit: 500 } });
    return { items: response.data.data, meta: response.data.meta! };
  },

  async assignPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await apiClient.patch(`/system/roles/${roleId}/permissions`, { permissionIds });
  },

  // GET /system/roles/:roleId/permissions -- added post-launch (see
  // docs/03-sad/21-module-system.md Section 6.1 addendum) to fix the
  // Role-Permissions modal opening with every checkbox unchecked.
  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const response = await apiClient.get<ApiSuccessBody<Permission[]>>(`/system/roles/${roleId}/permissions`);
    return response.data.data;
  },
};
