import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cashAccountService, cashTransferService } from "../services/finance.service";

export function useCashAccountMovements(cashAccountId: string | null) {
  return useQuery({
    queryKey: ["finance", "cash-accounts", "movements", cashAccountId],
    queryFn: () => cashAccountService.movements(cashAccountId as string),
    enabled: !!cashAccountId,
  });
}

export function useCreateCashTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cashTransferService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["finance", "cash-accounts"] }),
  });
}
