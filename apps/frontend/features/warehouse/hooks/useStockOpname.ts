import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockOpnameService } from "../services/warehouse.service";
import { SubmitStockOpnameItemEntry } from "../types/warehouse.types";

function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ["warehouse", "stock-opnames", "list"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["warehouse", "stock-opnames", "detail", id] });
}

export function useStockOpnames(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["warehouse", "stock-opnames", "list", params], queryFn: () => stockOpnameService.list(params) });
}

export function useStockOpname(id: string) {
  return useQuery({ queryKey: ["warehouse", "stock-opnames", "detail", id], queryFn: () => stockOpnameService.detail(id), enabled: !!id });
}

export function useCreateStockOpname() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: stockOpnameService.create, onSuccess: () => invalidate(queryClient) });
}

export function useStartStockOpnameCount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => stockOpnameService.startCount(id), onSuccess: () => invalidate(queryClient, id) });
}

export function useSubmitStockOpnameCount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: SubmitStockOpnameItemEntry[]) => stockOpnameService.submitCount(id, items),
    onSuccess: () => invalidate(queryClient, id),
  });
}

export function useApproveStockOpname(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => stockOpnameService.approve(id), onSuccess: () => invalidate(queryClient, id) });
}

export function usePostStockOpname(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => stockOpnameService.postOpname(id),
    onSuccess: () => {
      invalidate(queryClient, id);
      queryClient.invalidateQueries({ queryKey: ["warehouse", "stocks"] });
    },
  });
}
