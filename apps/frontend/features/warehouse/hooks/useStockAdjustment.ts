import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stockAdjustmentService } from "../services/warehouse.service";

function invalidateStock(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["warehouse", "stocks"] });
}

export function useCreateStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: stockAdjustmentService.create, onSuccess: () => invalidateStock(queryClient) });
}

export function useApproveStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => stockAdjustmentService.approve(id), onSuccess: () => invalidateStock(queryClient) });
}

export function usePostStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => stockAdjustmentService.postAdjustment(id), onSuccess: () => invalidateStock(queryClient) });
}
