import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { menuService } from "../services/menu.service";

export function useMenus(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["system", "menus", "list", params], queryFn: () => menuService.list(params) });
}

export function useCreateMenu() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: menuService.create, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "menus"] }) });
}

export function useUpdateMenuPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ menuId, permissionIds }: { menuId: string; permissionIds: string[] }) => menuService.updatePermissions(menuId, permissionIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["system", "menus"] }),
  });
}
