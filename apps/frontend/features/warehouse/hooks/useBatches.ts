import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { batchService } from "../services/warehouse.service";

export function useBatches(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["warehouse", "batches", "list", params], queryFn: () => batchService.list(params) });
}

export function useQuarantineBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => batchService.quarantine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["warehouse", "batches"] }),
  });
}
