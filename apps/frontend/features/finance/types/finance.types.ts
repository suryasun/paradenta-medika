// Mirrors apps/backend/src/modules/finance's actual DTOs/Prisma enums
// (verified against the real route/DTO files -- see docs/02-design/pages/
// finance.md's own "backend-grounded" note). Request enums are lowercase
// on Account/CashAccount (the DTO/mapper translates casing to the
// uppercase Prisma enum server-side); every other enum is UPPERCASE.

export type FinanceAccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
export type FinanceNormalBalance = "debit" | "credit";

export interface Account {
  id: string;
  branchId: string | null;
  code: string;
  name: string;
  accountType: FinanceAccountType;
  normalBalance: FinanceNormalBalance;
  parentId: string | null;
  isPostable: boolean;
  isActive: boolean;
}

export type FinanceJournalStatus = "DRAFT" | "POSTED" | "REVERSED" | "VOIDED";

export interface JournalLineEntry {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
  costCenterId?: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  debit: number;
  credit: number;
  description: string | null;
  costCenterId: string | null;
}

export interface Journal {
  id: string;
  journalNo: string | null;
  branchId: string;
  journalDate: string;
  referenceType: string | null;
  referenceId: string | null;
  postingType: string | null;
  description: string;
  status: FinanceJournalStatus;
  lines: JournalLine[];
  debitTotal: number;
  creditTotal: number;
  postedAt: string | null;
  postedBy: string | null;
  voidedAt: string | null;
  voidedBy: string | null;
  voidReason: string | null;
  reversalOfId: string | null;
  reverseReason: string | null;
  createdAt: string;
  createdBy: string;
}

export type FinancialPeriodStatus = "OPEN" | "LOCKED" | "CLOSED";

export interface FinancialPeriod {
  id: string;
  branchId: string;
  periodName: string;
  startDate: string;
  endDate: string;
  status: FinancialPeriodStatus;
  lockedBy: string | null;
  lockedAt: string | null;
  closedBy: string | null;
  closedAt: string | null;
  reopenedBy: string | null;
  reopenedAt: string | null;
  reopenReason: string | null;
  createdAt: string;
  createdBy: string;
}

export type CashAccountType = "cash" | "bank" | "clearing";

export interface CashAccount {
  id: string;
  branchId: string;
  code: string;
  name: string;
  accountType: CashAccountType;
  ledgerAccountId: string;
  accountNumber: string | null;
  currentBalance: number;
  isActive: boolean;
}

export interface CashAccountMovement {
  journalId: string;
  journalNo: string | null;
  journalDate: string;
  debit: number;
  credit: number;
  description: string | null;
}

export type FinanceExpenseStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "PAID" | "CANCELLED";

export interface Expense {
  id: string;
  expenseNo: string;
  branchId: string;
  expenseDate: string;
  category: string;
  expenseAccountId: string;
  amount: number;
  approvedAmount: number | null;
  paidAmount: number | null;
  payeeName: string | null;
  description: string | null;
  evidenceUrl: string | null;
  status: FinanceExpenseStatus;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  paidBy: string | null;
  paidAt: string | null;
  paymentJournalId: string | null;
  createdAt: string;
  createdBy: string;
}

export type DailyClosingStatus = "SUBMITTED" | "APPROVED";

export interface DenominationEntry {
  nominal: number;
  quantity: number;
}

export interface DailyClosing {
  id: string;
  branchId: string;
  cashAccountId: string;
  cashierId: string;
  closingDate: string;
  expectedBalance: number;
  countedBalance: number;
  variance: number;
  varianceReason: string | null;
  denominations: DenominationEntry[] | null;
  status: DailyClosingStatus;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  createdBy: string;
}

export type DoctorFeeSettlementStatus = "DRAFT" | "APPROVED" | "PAID" | "CANCELLED";

export interface DoctorFeeSettlementItem {
  id: string;
  visitTreatmentId: string;
  amount: number;
}

export interface DoctorFeeSettlement {
  id: string;
  settlementNo: string;
  branchId: string;
  doctorId: string;
  periodStart: string;
  periodEnd: string;
  feeAccountId: string;
  grossAmount: number;
  deductions: number;
  netAmount: number;
  status: DoctorFeeSettlementStatus;
  items: DoctorFeeSettlementItem[];
  approvedBy: string | null;
  approvedAt: string | null;
  paidBy: string | null;
  paidAt: string | null;
  paymentJournalId: string | null;
  createdAt: string;
  createdBy: string;
}

export interface FinanceAccountMapping {
  id: string;
  branchId: string;
  paymentMethodId: string;
  cashAccountId: string;
  revenueAccountId: string;
  isActive: boolean;
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

export interface GeneralLedgerRow {
  journalId: string;
  journalNo: string | null;
  journalDate: string;
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

export interface CashFlowRow {
  cashAccountId: string;
  cashAccountCode: string;
  cashAccountName: string;
  category: string;
  inflow: number;
  outflow: number;
  net: number;
}
