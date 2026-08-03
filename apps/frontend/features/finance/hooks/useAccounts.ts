import { useQuery } from "@tanstack/react-query";
import { accountService, cashAccountService } from "../services/finance.service";

export function useAccounts(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["finance", "accounts", "list", params], queryFn: () => accountService.list(params) });
}

export function useCashAccounts(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["finance", "cash-accounts", "list", params], queryFn: () => cashAccountService.list(params) });
}
