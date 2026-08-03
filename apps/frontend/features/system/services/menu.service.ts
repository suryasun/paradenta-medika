import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import { Menu, MenuWithPermissionIds } from "../types/system.types";

export const menuService = {
  async list(params: Record<string, unknown> = {}): Promise<{ items: Menu[]; meta: PaginationMeta }> {
    const response = await apiClient.get<ApiSuccessBody<Menu[]>>("/system/menus", { params: { limit: 100, ...params } });
    return { items: response.data.data, meta: response.data.meta! };
  },
  async create(payload: { menuKey: string; label: string; route?: string; parentId?: string; icon?: string; order?: number }): Promise<Menu> {
    const response = await apiClient.post<ApiSuccessBody<Menu>>("/system/menus", payload);
    return response.data.data;
  },
  async updatePermissions(menuId: string, permissionIds: string[]): Promise<MenuWithPermissionIds> {
    const response = await apiClient.patch<ApiSuccessBody<MenuWithPermissionIds>>(`/system/menus/${menuId}/permissions`, { permissionIds });
    return response.data.data;
  },
};
