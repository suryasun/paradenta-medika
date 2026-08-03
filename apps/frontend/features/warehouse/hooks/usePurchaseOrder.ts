import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { purchaseOrderService } from "../services/warehouse.service";

function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ["warehouse", "purchase-orders", "list"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["warehouse", "purchase-orders", "detail", id] });
}

export function usePurchaseOrders(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["warehouse", "purchase-orders", "list", params], queryFn: () => purchaseOrderService.list(params) });
}

export function usePurchaseOrder(id: string) {
  return useQuery({ queryKey: ["warehouse", "purchase-orders", "detail", id], queryFn: () => purchaseOrderService.detail(id), enabled: !!id });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: purchaseOrderService.create, onSuccess: () => invalidate(queryClient) });
}

export function useSubmitPurchaseOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => purchaseOrderService.submit(id), onSuccess: () => invalidate(queryClient, id) });
}

export function useApprovePurchaseOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => purchaseOrderService.approve(id), onSuccess: () => invalidate(queryClient, id) });
}

export function useRejectPurchaseOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (reason: string) => purchaseOrderService.reject(id, reason), onSuccess: () => invalidate(queryClient, id) });
}

export function useCancelPurchaseOrder(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (reason?: string) => purchaseOrderService.cancel(id, reason), onSuccess: () => invalidate(queryClient, id) });
}
