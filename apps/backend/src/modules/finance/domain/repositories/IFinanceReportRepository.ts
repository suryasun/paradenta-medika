import { FinanceAccountType, FinanceNormalBalance } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface ReportDateFilter {
  branchId: string;
  dateFrom: Date;
  dateTo: Date;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: FinanceAccountType;
  normalBalance: FinanceNormalBalance;
  debit: number;
  credit: number;
  balance: number;
}

export interface GeneralLedgerFilter extends ReportDateFilter {
  accountId?: string;
}

export interface GeneralLedgerRow {
  journalId: string;
  journalNo: string | null;
  journalDate: Date;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description: string | null;
  referenceType: string | null;
  referenceId: string | null;
}

export interface IncomeStatementLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
}

export interface IncomeStatementResult {
  revenue: IncomeStatementLine[];
  expense: IncomeStatementLine[];
  totalRevenue: number;
  totalExpense: number;
  netResult: number;
}

export interface CashFlowFilter extends ReportDateFilter {
  cashAccountId?: string;
}

export interface CashFlowRow {
  cashAccountId: string;
  cashAccountCode: string;
  cashAccountName: string;
  category: string;
  inflow: number;
  outflow: number;
  net: number;
}

/**
 * docs/03-sad/17-module-finance.md Section 6.5 Reports: read-only,
 * cross-entity aggregation queries sourced from posted journal data only
 * -- Expenses (task-176) and Daily Closing (task-177) reports reuse
 * IExpenseRepository/IDailyClosingRepository directly instead (their
 * shapes already match Section 6.5's literal output column list), the
 * same precedent as Warehouse's IWarehouseReportRepository (Epic AA).
 */
export interface IFinanceReportRepository {
  getTrialBalance(filter: ReportDateFilter): Promise<TrialBalanceRow[]>;
  getGeneralLedger(filter: GeneralLedgerFilter, query: ListQueryDto): Promise<PagedResult<GeneralLedgerRow>>;
  getIncomeStatement(filter: ReportDateFilter): Promise<IncomeStatementResult>;
  getCashFlow(filter: CashFlowFilter): Promise<CashFlowRow[]>;
}
