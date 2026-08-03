import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financialPeriodService } from "../services/finance.service";

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["finance", "periods"] });
}

export function useFinancialPeriods(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["finance", "periods", "list", params], queryFn: () => financialPeriodService.list(params) });
}

export function useCreateFinancialPeriod() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: financialPeriodService.create, onSuccess: () => invalidate(queryClient) });
}

export function useLockFinancialPeriod() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => financialPeriodService.lock(id), onSuccess: () => invalidate(queryClient) });
}

export function useCloseFinancialPeriod() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id: string) => financialPeriodService.close(id), onSuccess: () => invalidate(queryClient) });
}

export function useReopenFinancialPeriod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => financialPeriodService.reopen(id, reason),
    onSuccess: () => invalidate(queryClient),
  });
}
