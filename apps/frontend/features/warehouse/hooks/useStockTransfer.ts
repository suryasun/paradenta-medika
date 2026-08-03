import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stockTransferService } from "../services/warehouse.service";

function invalidateStock(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["warehouse", "stocks"] });
}

export function useCreateStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: stockTransferService.create, onSuccess: () => invalidateStock(queryClient) });
}

export function useSubmitStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => stockTransferService.submit(id), onSuccess: () => invalidateStock(queryClient) });
}

export function useApproveStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => stockTransferService.approve(id), onSuccess: () => invalidateStock(queryClient) });
}

export function useDispatchStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => stockTransferService.dispatch(id), onSuccess: () => invalidateStock(queryClient) });
}

export function useReceiveStockTransfer() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => stockTransferService.receive(id), onSuccess: () => invalidateStock(queryClient) });
}
