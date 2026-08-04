import { useQuery } from "@tanstack/react-query";
import { roleService } from "../services/role.service";

export function useRoles(search?: string) {
  return useQuery({
    queryKey: ["system", "roles", "list", search ?? ""],
    queryFn: () => roleService.list({ search }),
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["system", "permissions", "list"],
    queryFn: () => roleService.listPermissions(),
  });
}

export function useRolePermissions(roleId: string) {
  return useQuery({
    queryKey: ["system", "roles", "permissions", roleId],
    queryFn: () => roleService.getPermissionsForRole(roleId),
    enabled: Boolean(roleId),
  });
}

// Phase 4, task-215.
export function useRoleBranchMatrix() {
  return useQuery({
    queryKey: ["system", "roles", "branch-matrix"],
    queryFn: () => roleService.getBranchMatrix(),
  });
}
