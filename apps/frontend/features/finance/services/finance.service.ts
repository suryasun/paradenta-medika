import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody, PaginationMeta } from "@/types/api";
import {
  Account,
  CashAccount,
  CashAccountMovement,
  CashFlowRow,
  DailyClosing,
  DoctorFeeSettlement,
  Expense,
  FinanceAccountMapping,
  FinancialPeriod,
  GeneralLedgerRow,
  IncomeStatementResult,
  Journal,
  JournalLineEntry,
  TrialBalanceRow,
} from "../types/finance.types";

async function list<T>(path: string, params: Record<string, unknown> = {}): Promise<{ items: T[]; meta: PaginationMeta }> {
  const response = await apiClient.get<ApiSuccessBody<T[]>>(path, { params: { limit: 100, ...params } });
  return { items: response.data.data, meta: response.data.meta! };
}

async function detail<T>(path: string): Promise<T> {
  const response = await apiClient.get<ApiSuccessBody<T>>(path);
  return response.data.data;
}

async function raw<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
  const response = await apiClient.get<ApiSuccessBody<T>>(path, { params });
  return response.data.data;
}

async function post<T>(path: string, payload?: Record<string, unknown>): Promise<T> {
  const response = await apiClient.post<ApiSuccessBody<T>>(path, payload);
  return response.data.data;
}

export const accountService = {
  list: (params?: Record<string, unknown>) => list<Account>("/finance/accounts", params),
  create: (payload: Record<string, unknown>) => post<Account>("/finance/accounts", payload),
  update: async (id: string, payload: Record<string, unknown>) => {
    const response = await apiClient.patch<ApiSuccessBody<Account>>(`/finance/accounts/${id}`, payload);
    return response.data.data;
  },
  deactivate: (id: string) => post<Account>(`/finance/accounts/${id}/deactivate`),
};

export const journalService = {
  list: (params?: Record<string, unknown>) => list<Journal>("/finance/journals", params),
  detail: (id: string) => detail<Journal>(`/finance/journals/${id}`),
  create: (payload: { branchId: string; journalDate: string; description: string; lines: JournalLineEntry[] }) =>
    post<Journal>("/finance/journals", payload),
  update: async (id: string, payload: Record<string, unknown>) => {
    const response = await apiClient.patch<ApiSuccessBody<Journal>>(`/finance/journals/${id}`, payload);
    return response.data.data;
  },
  postJournal: (id: string) => post<Journal>(`/finance/journals/${id}/post`),
  reverse: (id: string, payload: { journalDate: string; reason: string }) => post<Journal>(`/finance/journals/${id}/reverse`, payload),
  voidJournal: (id: string, reason?: string) => post<Journal>(`/finance/journals/${id}/void`, { reason }),
};

export const financialPeriodService = {
  list: (params?: Record<string, unknown>) => list<FinancialPeriod>("/finance/periods", params),
  create: (payload: { branchId: string; periodName: string; startDate: string; endDate: string }) =>
    post<FinancialPeriod>("/finance/periods", payload),
  lock: (id: string) => post<FinancialPeriod>(`/finance/periods/${id}/lock`),
  close: (id: string) => post<FinancialPeriod>(`/finance/periods/${id}/close`),
  reopen: (id: string, reason: string) => post<FinancialPeriod>(`/finance/periods/${id}/reopen`, { reason }),
};

export const cashAccountService = {
  list: (params?: Record<string, unknown>) => list<CashAccount>("/finance/cash-accounts", params),
  create: (payload: Record<string, unknown>) => post<CashAccount>("/finance/cash-accounts", payload),
  update: async (id: string, payload: Record<string, unknown>) => {
    const response = await apiClient.patch<ApiSuccessBody<CashAccount>>(`/finance/cash-accounts/${id}`, payload);
    return response.data.data;
  },
  movements: (id: string, params?: Record<string, unknown>) => list<CashAccountMovement>(`/finance/cash-accounts/${id}/movements`, params),
};

export const cashTransferService = {
  create: (payload: { transferDate: string; sourceCashAccountId: string; destinationCashAccountId: string; amount: number; description?: string }) =>
    post<Journal>("/finance/cash-transfers", payload),
};

export const expenseService = {
  list: (params?: Record<string, unknown>) => list<Expense>("/finance/expenses", params),
  detail: (id: string) => detail<Expense>(`/finance/expenses/${id}`),
  create: (payload: Record<string, unknown>) => post<Expense>("/finance/expenses", payload),
  update: async (id: string, payload: Record<string, unknown>) => {
    const response = await apiClient.patch<ApiSuccessBody<Expense>>(`/finance/expenses/${id}`, payload);
    return response.data.data;
  },
  submit: (id: string) => post<Expense>(`/finance/expenses/${id}/submit`),
  approve: (id: string) => post<Expense>(`/finance/expenses/${id}/approve`),
  reject: (id: string, reason: string) => post<Expense>(`/finance/expenses/${id}/reject`, { reason }),
  pay: (id: string, payload: { cashAccountId: string; paymentDate: string; amount: number; referenceNo?: string; note?: string }) =>
    post<Expense>(`/finance/expenses/${id}/pay`, payload),
};

export const dailyClosingService = {
  list: (params?: Record<string, unknown>) => list<DailyClosing>("/finance/daily-closings", params),
  create: (payload: Record<string, unknown>) => post<DailyClosing>("/finance/daily-closings", payload),
  approve: (id: string) => post<DailyClosing>(`/finance/daily-closings/${id}/approve`),
};

export const doctorFeeSettlementService = {
  generate: (payload: { branchId: string; doctorId: string; periodStart: string; periodEnd: string; feeAccountId: string }) =>
    post<DoctorFeeSettlement>("/finance/doctor-fee-settlements/generate", payload),
  approve: (id: string) => post<DoctorFeeSettlement>(`/finance/doctor-fee-settlements/${id}/approve`),
  pay: (id: string, payload: { cashAccountId: string; paymentDate: string }) =>
    post<DoctorFeeSettlement>(`/finance/doctor-fee-settlements/${id}/pay`, payload),
};

export const financeAccountMappingService = {
  list: (params?: Record<string, unknown>) => list<FinanceAccountMapping>("/finance/account-mappings", params),
  create: (payload: { branchId: string; paymentMethodId: string; cashAccountId: string; revenueAccountId: string }) =>
    post<FinanceAccountMapping>("/finance/account-mappings", payload),
};

export const financeReportsService = {
  trialBalance: (params: Record<string, unknown>) => raw<TrialBalanceRow[]>("/finance/reports/trial-balance", params),
  generalLedger: (params: Record<string, unknown>) => list<GeneralLedgerRow>("/finance/reports/general-ledger", params),
  incomeStatement: (params: Record<string, unknown>) => raw<IncomeStatementResult>("/finance/reports/income-statement", params),
  cashFlow: (params: Record<string, unknown>) => raw<CashFlowRow[]>("/finance/reports/cash-flow", params),
  expenses: (params?: Record<string, unknown>) => list<Expense>("/finance/reports/expenses", params),
  dailyClosing: (params?: Record<string, unknown>) => list<DailyClosing>("/finance/reports/daily-closing", params),
};
