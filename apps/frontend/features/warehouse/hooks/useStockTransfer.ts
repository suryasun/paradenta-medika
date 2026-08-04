import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { stockTransferService } from "../services/warehouse.service";

function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ["warehouse", "stocks"] });
  queryClient.invalidateQueries({ queryKey: ["warehouse", "transfers", "list"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["warehouse", "transfers", "detail", id] });
}

export function useStockTransfers(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["warehouse", "transfers", "list", params], queryFn: () => stockTransferService.list(params) });
}

export function useStockTransfer(id: string) {
  return useQuery({ queryKey: ["warehouse", "transfers", "detail", id], queryFn: () => stockTransferService.detail(id), enabled: !!id });
}

export function useCreateStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: stockTransferService.create, onSuccess: () => invalidate(queryClient) });
}

export function useSubmitStockTransfer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => stockTransferService.submit(id), onSuccess: () => invalidate(queryClient, id) });
}

export function useApproveStockTransfer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => stockTransferService.approve(id), onSuccess: () => invalidate(queryClient, id) });
}

export function useDispatchStockTransfer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => stockTransferService.dispatch(id), onSuccess: () => invalidate(queryClient, id) });
}

export function useReceiveStockTransfer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => stockTransferService.receive(id), onSuccess: () => invalidate(queryClient, id) });
}
