import { Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';
import {
  CashFlowFilter,
  CashFlowRow,
  GeneralLedgerFilter,
  GeneralLedgerRow,
  IFinanceReportRepository,
  IncomeStatementResult,
  ReportDateFilter,
  TrialBalanceRow,
} from '../../domain/repositories/IFinanceReportRepository';

export class FinanceReportRepository implements IFinanceReportRepository {
  async getTrialBalance(filter: ReportDateFilter): Promise<TrialBalanceRow[]> {
    const lines = await prisma.journalLine.findMany({
      where: {
        journal: {
          branchId: filter.branchId,
          status: 'POSTED',
          journalDate: { gte: filter.dateFrom, lte: filter.dateTo },
        },
      },
      include: { account: true },
    });

    const byAccount = new Map<string, TrialBalanceRow>();
    for (const line of lines) {
      const existing = byAccount.get(line.accountId) ?? {
        accountId: line.accountId,
        accountCode: line.account.code,
        accountName: line.account.name,
        accountType: line.account.accountType,
        normalBalance: line.account.normalBalance,
        debit: 0,
        credit: 0,
        balance: 0,
      };
      existing.debit += Number(line.debit);
      existing.credit += Number(line.credit);
      byAccount.set(line.accountId, existing);
    }

    return [...byAccount.values()]
      .map((row) => ({ ...row, balance: row.normalBalance === 'DEBIT' ? row.debit - row.credit : row.credit - row.debit }))
      .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  async getGeneralLedger(filter: GeneralLedgerFilter, query: ListQueryDto): Promise<PagedResult<GeneralLedgerRow>> {
    const where: Prisma.JournalLineWhereInput = {
      accountId: filter.accountId,
      journal: {
        branchId: filter.branchId,
        status: 'POSTED',
        journalDate: { gte: filter.dateFrom, lte: filter.dateTo },
      },
    };

    const [lines, total] = await Promise.all([
      prisma.journalLine.findMany({
        where,
        include: { journal: true, account: true },
        orderBy: { journal: { journalDate: query.order } },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.journalLine.count({ where }),
    ]);

    return {
      items: lines.map((line) => ({
        journalId: line.journalId,
        journalNo: line.journal.journalNo,
        journalDate: line.journal.journalDate,
        accountId: line.accountId,
        accountCode: line.account.code,
        accountName: line.account.name,
        debit: Number(line.debit),
        credit: Number(line.credit),
        description: line.description,
        referenceType: line.journal.referenceType,
        referenceId: line.journal.referenceId,
      })),
      total,
    };
  }

  async getIncomeStatement(filter: ReportDateFilter): Promise<IncomeStatementResult> {
    const lines = await prisma.journalLine.findMany({
      where: {
        journal: {
          branchId: filter.branchId,
          status: 'POSTED',
          journalDate: { gte: filter.dateFrom, lte: filter.dateTo },
        },
        account: { accountType: { in: ['REVENUE', 'EXPENSE'] } },
      },
      include: { account: true },
    });

    const revenueMap = new Map<string, { accountId: string; accountCode: string; accountName: string; amount: number }>();
    const expenseMap = new Map<string, { accountId: string; accountCode: string; accountName: string; amount: number }>();

    for (const line of lines) {
      const isRevenue = line.account.accountType === 'REVENUE';
      const map = isRevenue ? revenueMap : expenseMap;
      const existing = map.get(line.accountId) ?? {
        accountId: line.accountId,
        accountCode: line.account.code,
        accountName: line.account.name,
        amount: 0,
      };
      // Revenue is credit-normal (credit increases it); Expense is debit-normal.
      existing.amount += isRevenue ? Number(line.credit) - Number(line.debit) : Number(line.debit) - Number(line.credit);
      map.set(line.accountId, existing);
    }

    const revenue = [...revenueMap.values()].sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    const expense = [...expenseMap.values()].sort((a, b) => a.accountCode.localeCompare(b.accountCode));
    const totalRevenue = revenue.reduce((sum, row) => sum + row.amount, 0);
    const totalExpense = expense.reduce((sum, row) => sum + row.amount, 0);

    return { revenue, expense, totalRevenue, totalExpense, netResult: totalRevenue - totalExpense };
  }

  async getCashFlow(filter: CashFlowFilter): Promise<CashFlowRow[]> {
    const cashAccounts = await prisma.cashAccount.findMany({
      where: { branchId: filter.branchId, id: filter.cashAccountId },
    });
    if (!cashAccounts.length) {
      return [];
    }

    const cashAccountByLedgerId = new Map(cashAccounts.map((cashAccount) => [cashAccount.ledgerAccountId, cashAccount]));
    const lines = await prisma.journalLine.findMany({
      where: {
        accountId: { in: [...cashAccountByLedgerId.keys()] },
        journal: {
          branchId: filter.branchId,
          status: 'POSTED',
          journalDate: { gte: filter.dateFrom, lte: filter.dateTo },
        },
      },
      include: { journal: true },
    });

    const rows = new Map<string, CashFlowRow>();
    for (const line of lines) {
      const cashAccount = cashAccountByLedgerId.get(line.accountId)!;
      const category = line.journal.postingType ?? 'UNCATEGORIZED';
      const key = `${cashAccount.id}::${category}`;
      const existing = rows.get(key) ?? {
        cashAccountId: cashAccount.id,
        cashAccountCode: cashAccount.code,
        cashAccountName: cashAccount.name,
        category,
        inflow: 0,
        outflow: 0,
        net: 0,
      };
      // Cash accounts' ledger account is debit-normal (asset): a debit line increases cash (inflow).
      existing.inflow += Number(line.debit);
      existing.outflow += Number(line.credit);
      rows.set(key, existing);
    }

    return [...rows.values()]
      .map((row) => ({ ...row, net: row.inflow - row.outflow }))
      .sort((a, b) => a.cashAccountCode.localeCompare(b.cashAccountCode) || a.category.localeCompare(b.category));
  }
}
