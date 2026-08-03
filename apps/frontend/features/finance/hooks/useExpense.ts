import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { expenseService } from "../services/finance.service";

function invalidate(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  queryClient.invalidateQueries({ queryKey: ["finance", "expenses", "list"] });
  if (id) queryClient.invalidateQueries({ queryKey: ["finance", "expenses", "detail", id] });
}

export function useExpenses(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["finance", "expenses", "list", params], queryFn: () => expenseService.list(params) });
}

export function useExpense(id: string) {
  return useQuery({ queryKey: ["finance", "expenses", "detail", id], queryFn: () => expenseService.detail(id), enabled: !!id });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: expenseService.create, onSuccess: () => invalidate(queryClient) });
}

export function useSubmitExpense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => expenseService.submit(id), onSuccess: () => invalidate(queryClient, id) });
}

export function useApproveExpense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: () => expenseService.approve(id), onSuccess: () => invalidate(queryClient, id) });
}

export function useRejectExpense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (reason: string) => expenseService.reject(id, reason), onSuccess: () => invalidate(queryClient, id) });
}

export function usePayExpense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { cashAccountId: string; paymentDate: string; amount: number; referenceNo?: string; note?: string }) =>
      expenseService.pay(id, payload),
    onSuccess: () => invalidate(queryClient, id),
  });
}
