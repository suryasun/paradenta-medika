import { GetTrialBalanceReportUseCase } from './GetTrialBalanceReportUseCase';
import { GetGeneralLedgerReportUseCase } from './GetGeneralLedgerReportUseCase';
import { GetIncomeStatementReportUseCase } from './GetIncomeStatementReportUseCase';
import { GetCashFlowReportUseCase } from './GetCashFlowReportUseCase';
import { GetExpensesReportUseCase } from './GetExpensesReportUseCase';
import { GetDailyClosingReportUseCase } from './GetDailyClosingReportUseCase';
import { ReportDateRangeResolver } from '../services/ReportDateRangeResolver';
import { ReportDateRangeRequiredException } from '../../domain/exceptions/FinanceExceptions';
import {
  FakeAccountRepository,
  FakeCashAccountRepository,
  FakeDailyClosingRepository,
  FakeExpenseRepository,
  FakeFinanceReportRepository,
  FakeFinancialPeriodRepository,
  FakeJournalRepository,
} from '../../../../../tests/fakes/financeFakes';

function buildSut() {
  const journalRepository = new FakeJournalRepository();
  const accountRepository = new FakeAccountRepository();
  const cashAccountRepository = new FakeCashAccountRepository();
  const financialPeriodRepository = new FakeFinancialPeriodRepository();
  const expenseRepository = new FakeExpenseRepository();
  const dailyClosingRepository = new FakeDailyClosingRepository();
  const reportRepository = new FakeFinanceReportRepository(journalRepository, accountRepository, cashAccountRepository);
  const dateRangeResolver = new ReportDateRangeResolver(financialPeriodRepository);

  return {
    journalRepository,
    accountRepository,
    cashAccountRepository,
    financialPeriodRepository,
    expenseRepository,
    dailyClosingRepository,
    trialBalanceUseCase: new GetTrialBalanceReportUseCase(reportRepository, dateRangeResolver),
    generalLedgerUseCase: new GetGeneralLedgerReportUseCase(reportRepository, dateRangeResolver),
    incomeStatementUseCase: new GetIncomeStatementReportUseCase(reportRepository, dateRangeResolver),
    cashFlowUseCase: new GetCashFlowReportUseCase(reportRepository, dateRangeResolver),
    expensesReportUseCase: new GetExpensesReportUseCase(expenseRepository, dateRangeResolver),
    dailyClosingReportUseCase: new GetDailyClosingReportUseCase(dailyClosingRepository, dateRangeResolver),
  };
}

async function seedPostedJournal(
  journalRepository: FakeJournalRepository,
  input: {
    branchId: string;
    journalDate: Date;
    journalNo: string;
    postingType?: string;
    lines: Array<{ accountId: string; debit: number; credit: number }>;
  },
) {
  const journal = await journalRepository.create({
    branchId: input.branchId,
    journalDate: input.journalDate,
    description: 'seed',
    postingType: input.postingType,
    lines: input.lines,
    createdBy: 'u1',
  });
  return journalRepository.markPosted(journal.id, input.journalNo, 'u2', new Date());
}

describe('Finance Reports (task-172-177, SAD Section 6.5)', () => {
  it('trial balance aggregates debit/credit/balance per account, posted journals only', async () => {
    const { journalRepository, accountRepository, trialBalanceUseCase } = buildSut();
    const cash = await accountRepository.create({
      branchId: 'branch-1',
      code: '1000',
      name: 'Cash',
      accountType: 'ASSET',
      normalBalance: 'DEBIT',
      isPostable: true,
      createdBy: 'u1',
    });
    const revenue = await accountRepository.create({
      branchId: 'branch-1',
      code: '4000',
      name: 'Service Revenue',
      accountType: 'REVENUE',
      normalBalance: 'CREDIT',
      isPostable: true,
      createdBy: 'u1',
    });

    await seedPostedJournal(journalRepository, {
      branchId: 'branch-1',
      journalDate: new Date('2026-08-01'),
      journalNo: 'JRN-0001',
      lines: [
        { accountId: cash.id, debit: 100, credit: 0 },
        { accountId: revenue.id, debit: 0, credit: 100 },
      ],
    });
    // Draft journal must be excluded.
    await journalRepository.create({
      branchId: 'branch-1',
      journalDate: new Date('2026-08-01'),
      description: 'draft',
      lines: [{ accountId: cash.id, debit: 999, credit: 0 }],
      createdBy: 'u1',
    });

    const rows = await trialBalanceUseCase.execute({
      branchId: 'branch-1',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });

    const cashRow = rows.find((r) => r.accountId === cash.id);
    const revenueRow = rows.find((r) => r.accountId === revenue.id);
    expect(cashRow?.balance).toBe(100);
    expect(revenueRow?.balance).toBe(100);
    expect(rows.reduce((sum, r) => sum + r.debit, 0)).toBe(rows.reduce((sum, r) => sum + r.credit, 0));
  });

  it('requires dateFrom/dateTo when no periodId is given', async () => {
    const { trialBalanceUseCase } = buildSut();
    await expect(
      trialBalanceUseCase.execute({ branchId: 'branch-1', page: 1, limit: 20, sort: 'createdAt', order: 'desc' }),
    ).rejects.toBeInstanceOf(ReportDateRangeRequiredException);
  });

  it('resolves the date range from periodId when given', async () => {
    const { financialPeriodRepository, journalRepository, accountRepository, trialBalanceUseCase } = buildSut();
    const period = await financialPeriodRepository.create({
      branchId: 'branch-1',
      periodName: 'August 2026',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-31'),
      createdBy: 'u1',
    });
    const cash = await accountRepository.create({
      branchId: 'branch-1',
      code: '1000',
      name: 'Cash',
      accountType: 'ASSET',
      normalBalance: 'DEBIT',
      isPostable: true,
      createdBy: 'u1',
    });
    await seedPostedJournal(journalRepository, {
      branchId: 'branch-1',
      journalDate: new Date('2026-08-15'),
      journalNo: 'JRN-0001',
      lines: [{ accountId: cash.id, debit: 50, credit: 0 }],
    });

    const rows = await trialBalanceUseCase.execute({
      branchId: 'branch-1',
      periodId: period.id,
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });
    expect(rows.find((r) => r.accountId === cash.id)?.debit).toBe(50);
  });

  it('general ledger lists posted lines by account, optionally filtered', async () => {
    const { journalRepository, accountRepository, generalLedgerUseCase } = buildSut();
    const cash = await accountRepository.create({
      branchId: 'branch-1',
      code: '1000',
      name: 'Cash',
      accountType: 'ASSET',
      normalBalance: 'DEBIT',
      isPostable: true,
      createdBy: 'u1',
    });
    const revenue = await accountRepository.create({
      branchId: 'branch-1',
      code: '4000',
      name: 'Service Revenue',
      accountType: 'REVENUE',
      normalBalance: 'CREDIT',
      isPostable: true,
      createdBy: 'u1',
    });
    await seedPostedJournal(journalRepository, {
      branchId: 'branch-1',
      journalDate: new Date('2026-08-01'),
      journalNo: 'JRN-0001',
      lines: [
        { accountId: cash.id, debit: 100, credit: 0 },
        { accountId: revenue.id, debit: 0, credit: 100 },
      ],
    });

    const { items, total } = await generalLedgerUseCase.execute({
      branchId: 'branch-1',
      accountId: cash.id,
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });
    expect(total).toBe(1);
    expect(items[0].accountId).toBe(cash.id);
    expect(items[0].journalNo).toBe('JRN-0001');
  });

  it('income statement splits revenue/expense and computes net result', async () => {
    const { journalRepository, accountRepository, incomeStatementUseCase } = buildSut();
    const revenue = await accountRepository.create({
      branchId: 'branch-1',
      code: '4000',
      name: 'Service Revenue',
      accountType: 'REVENUE',
      normalBalance: 'CREDIT',
      isPostable: true,
      createdBy: 'u1',
    });
    const expense = await accountRepository.create({
      branchId: 'branch-1',
      code: '5000',
      name: 'Supplies Expense',
      accountType: 'EXPENSE',
      normalBalance: 'DEBIT',
      isPostable: true,
      createdBy: 'u1',
    });
    const cash = await accountRepository.create({
      branchId: 'branch-1',
      code: '1000',
      name: 'Cash',
      accountType: 'ASSET',
      normalBalance: 'DEBIT',
      isPostable: true,
      createdBy: 'u1',
    });
    await seedPostedJournal(journalRepository, {
      branchId: 'branch-1',
      journalDate: new Date('2026-08-01'),
      journalNo: 'JRN-0001',
      lines: [
        { accountId: cash.id, debit: 200, credit: 0 },
        { accountId: revenue.id, debit: 0, credit: 200 },
      ],
    });
    await seedPostedJournal(journalRepository, {
      branchId: 'branch-1',
      journalDate: new Date('2026-08-02'),
      journalNo: 'JRN-0002',
      lines: [
        { accountId: expense.id, debit: 50, credit: 0 },
        { accountId: cash.id, debit: 0, credit: 50 },
      ],
    });

    const result = await incomeStatementUseCase.execute({
      branchId: 'branch-1',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });
    expect(result.totalRevenue).toBe(200);
    expect(result.totalExpense).toBe(50);
    expect(result.netResult).toBe(150);
  });

  it('cash flow groups inflow/outflow by cash account and posting category', async () => {
    const { journalRepository, accountRepository, cashAccountRepository, cashFlowUseCase } = buildSut();
    const ledgerAccount = await accountRepository.create({
      branchId: 'branch-1',
      code: '1000',
      name: 'Cash',
      accountType: 'ASSET',
      normalBalance: 'DEBIT',
      isPostable: true,
      createdBy: 'u1',
    });
    const cashAccount = await cashAccountRepository.create({
      branchId: 'branch-1',
      code: 'CASH-1',
      name: 'Main Drawer',
      accountType: 'CASH',
      ledgerAccountId: ledgerAccount.id,
      createdBy: 'u1',
    });
    const revenue = await accountRepository.create({
      branchId: 'branch-1',
      code: '4000',
      name: 'Service Revenue',
      accountType: 'REVENUE',
      normalBalance: 'CREDIT',
      isPostable: true,
      createdBy: 'u1',
    });
    await seedPostedJournal(journalRepository, {
      branchId: 'branch-1',
      journalDate: new Date('2026-08-01'),
      journalNo: 'JRN-0001',
      postingType: 'billing-payment',
      lines: [
        { accountId: ledgerAccount.id, debit: 100, credit: 0 },
        { accountId: revenue.id, debit: 0, credit: 100 },
      ],
    });

    const rows = await cashFlowUseCase.execute({
      branchId: 'branch-1',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].cashAccountId).toBe(cashAccount.id);
    expect(rows[0].category).toBe('billing-payment');
    expect(rows[0].inflow).toBe(100);
    expect(rows[0].net).toBe(100);
  });

  it('expenses report reuses expense list, scoped by branch/date/status/category', async () => {
    const { expenseRepository, accountRepository, expensesReportUseCase } = buildSut();
    const expenseAccount = await accountRepository.create({
      branchId: 'branch-1',
      code: '5100',
      name: 'Office Supplies',
      accountType: 'EXPENSE',
      normalBalance: 'DEBIT',
      isPostable: true,
      createdBy: 'u1',
    });
    await expenseRepository.create({
      expenseNo: 'EXP-0001',
      branchId: 'branch-1',
      expenseDate: new Date('2026-08-05'),
      category: 'supplies',
      expenseAccountId: expenseAccount.id,
      amount: 75,
      payeeName: 'ACME',
      createdBy: 'u1',
    });

    const { items, total } = await expensesReportUseCase.execute({
      branchId: 'branch-1',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
      category: 'supplies',
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });
    expect(total).toBe(1);
    expect(items[0].payeeName).toBe('ACME');
    expect(items[0].status).toBe('DRAFT');
  });

  it('daily closing report reuses daily closing list, scoped by branch/date', async () => {
    const { dailyClosingRepository, cashAccountRepository, accountRepository, dailyClosingReportUseCase } = buildSut();
    const ledgerAccount = await accountRepository.create({
      branchId: 'branch-1',
      code: '1000',
      name: 'Cash',
      accountType: 'ASSET',
      normalBalance: 'DEBIT',
      isPostable: true,
      createdBy: 'u1',
    });
    const cashAccount = await cashAccountRepository.create({
      branchId: 'branch-1',
      code: 'CASH-1',
      name: 'Main Drawer',
      accountType: 'CASH',
      ledgerAccountId: ledgerAccount.id,
      createdBy: 'u1',
    });
    await dailyClosingRepository.create({
      branchId: 'branch-1',
      cashAccountId: cashAccount.id,
      cashierId: 'cashier-1',
      closingDate: new Date('2026-08-05'),
      expectedBalance: 100,
      countedBalance: 100,
      variance: 0,
      createdBy: 'cashier-1',
    });

    const { items, total } = await dailyClosingReportUseCase.execute({
      branchId: 'branch-1',
      dateFrom: '2026-08-01',
      dateTo: '2026-08-31',
      page: 1,
      limit: 20,
      sort: 'createdAt',
      order: 'desc',
    });
    expect(total).toBe(1);
    expect(items[0].expectedBalance).toBe(100);
    expect(items[0].variance).toBe(0);
  });
});
