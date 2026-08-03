import { useQuery } from "@tanstack/react-query";
import { financeReportsService } from "../services/finance.service";

export function useTrialBalanceReport(params: { branchId: string; periodId?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ["finance", "reports", "trial-balance", params],
    queryFn: () => financeReportsService.trialBalance(params),
    enabled: !!params.branchId,
  });
}

export function useGeneralLedgerReport(params: { branchId: string; periodId?: string; dateFrom?: string; dateTo?: string; accountId?: string }) {
  return useQuery({
    queryKey: ["finance", "reports", "general-ledger", params],
    queryFn: () => financeReportsService.generalLedger(params),
    enabled: !!params.branchId,
  });
}

export function useIncomeStatementReport(params: { branchId: string; periodId?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ["finance", "reports", "income-statement", params],
    queryFn: () => financeReportsService.incomeStatement(params),
    enabled: !!params.branchId,
  });
}

export function useCashFlowReport(params: { branchId: string; periodId?: string; dateFrom?: string; dateTo?: string; cashAccountId?: string }) {
  return useQuery({
    queryKey: ["finance", "reports", "cash-flow", params],
    queryFn: () => financeReportsService.cashFlow(params),
    enabled: !!params.branchId,
  });
}

export function useExpensesReport(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["finance", "reports", "expenses", params], queryFn: () => financeReportsService.expenses(params) });
}

export function useDailyClosingReport(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ["finance", "reports", "daily-closing", params], queryFn: () => financeReportsService.dailyClosing(params) });
}
