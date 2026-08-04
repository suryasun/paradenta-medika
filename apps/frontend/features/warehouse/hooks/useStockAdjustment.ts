import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockAdjustmentService } from "../services/warehouse.service";

function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ["warehouse", "stocks"] });
  queryClient.invalidateQueries({ queryKey: ["warehouse", "adjustments", "list"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["warehouse", "adjustments", "detail", id] });
}

export function useStockAdjustments(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["warehouse", "adjustments", "list", params], queryFn: () => stockAdjustmentService.list(params) });
}

export function useStockAdjustment(id: string) {
  return useQuery({ queryKey: ["warehouse", "adjustments", "detail", id], queryFn: () => stockAdjustmentService.detail(id), enabled: !!id });
}

export function useCreateStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: stockAdjustmentService.create, onSuccess: () => invalidate(queryClient) });
}

export function useApproveStockAdjustment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => stockAdjustmentService.approve(id), onSuccess: () => invalidate(queryClient, id) });
}

export function usePostStockAdjustment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => stockAdjustmentService.postAdjustment(id), onSuccess: () => invalidate(queryClient, id) });
}
