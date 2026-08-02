import { useMutation, useQueryClient } from "@tanstack/react-query";
import { roleService } from "../services/role.service";
import { CreateRoleInput } from "../types/system.types";

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoleInput) => roleService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "roles", "list"] }),
  });
}

export function useAssignPermissions(roleId: string) {
  return useMutation({
    mutationFn: (permissionIds: string[]) => roleService.assignPermissions(roleId, permissionIds),
  });
}
