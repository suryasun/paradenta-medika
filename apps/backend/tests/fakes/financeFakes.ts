import { Account, CashAccount, Expense, FinancialPeriod, Journal, JournalLine } from '@prisma/client';
import {
  AccountListFilter,
  CreateAccountInput,
  IAccountRepository,
  UpdateAccountInput,
} from '../../src/modules/finance/domain/repositories/IAccountRepository';
import {
  CreateJournalInput,
  CreatePostedJournalInput,
  IJournalRepository,
  JournalListFilter,
  JournalWithLines,
  PostedJournalLine,
  ReplaceJournalLinesInput,
} from '../../src/modules/finance/domain/repositories/IJournalRepository';
import {
  CreateFinancialPeriodInput,
  FinancialPeriodListFilter,
  IFinancialPeriodRepository,
} from '../../src/modules/finance/domain/repositories/IFinancialPeriodRepository';
import {
  CashAccountListFilter,
  CreateCashAccountInput,
  ICashAccountRepository,
} from '../../src/modules/finance/domain/repositories/ICashAccountRepository';
import {
  CreateExpenseInput,
  ExpenseListFilter,
  IExpenseRepository,
  UpdateExpenseInput,
} from '../../src/modules/finance/domain/repositories/IExpenseRepository';
import { ListQueryDto } from '../../src/shared/http/ListQueryDto';
import { PagedResult } from '../../src/shared/http/pagination';
import { nextFakeUuid } from './uuid';

export class FakeAccountRepository implements IAccountRepository {
  accounts = new Map<string, Account>();

  async create(input: CreateAccountInput): Promise<Account> {
    const account: Account = {
      id: nextFakeUuid(),
      branchId: input.branchId ?? null,
      code: input.code,
      name: input.name,
      accountType: input.accountType,
      normalBalance: input.normalBalance,
      parentId: input.parentId ?? null,
      isPostable: input.isPostable,
      isActive: true,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
    } as Account;
    this.accounts.set(account.id, account);
    return account;
  }

  async list(query: ListQueryDto, filter: AccountListFilter): Promise<PagedResult<Account>> {
    const all = [...this.accounts.values()].filter(
      (a) =>
        (!filter.branchId || a.branchId === filter.branchId) &&
        (!filter.accountType || a.accountType === filter.accountType) &&
        (!filter.parentId || a.parentId === filter.parentId) &&
        (filter.isActive === undefined || a.isActive === filter.isActive) &&
        (filter.isPostable === undefined || a.isPostable === filter.isPostable),
    );
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<Account | null> {
    return this.accounts.get(id) ?? null;
  }

  async findByBranchAndCode(branchId: string | null, code: string): Promise<Account | null> {
    return [...this.accounts.values()].find((a) => a.branchId === branchId && a.code === code) ?? null;
  }

  async update(id: string, input: UpdateAccountInput): Promise<Account> {
    const account = this.accounts.get(id);
    if (!account) throw new Error('not found');
    if (input.name !== undefined) account.name = input.name;
    if (input.accountType !== undefined) account.accountType = input.accountType;
    if (input.normalBalance !== undefined) account.normalBalance = input.normalBalance;
    if (input.parentId !== undefined) account.parentId = input.parentId;
    if (input.isPostable !== undefined) account.isPostable = input.isPostable;
    account.updatedBy = input.updatedBy;
    account.updatedAt = new Date();
    return account;
  }

  async deactivate(id: string, updatedBy: string): Promise<Account> {
    const account = this.accounts.get(id);
    if (!account) throw new Error('not found');
    account.isActive = false;
    account.updatedBy = updatedBy;
    account.updatedAt = new Date();
    return account;
  }
}

export class FakeJournalRepository implements IJournalRepository {
  journals = new Map<string, JournalWithLines>();
  private lineSequence = 0;

  private buildLines(lines: CreateJournalInput['lines'], journalId: string): JournalLine[] {
    return lines.map((line) => {
      this.lineSequence += 1;
      return {
        id: `jl-${this.lineSequence}-${nextFakeUuid()}`,
        journalId,
        accountId: line.accountId,
        debit: line.debit as never,
        credit: line.credit as never,
        description: line.description ?? null,
        costCenterId: line.costCenterId ?? null,
        createdAt: new Date(),
      } as JournalLine;
    });
  }

  async create(input: CreateJournalInput): Promise<JournalWithLines> {
    const journal: JournalWithLines = {
      id: nextFakeUuid(),
      journalNo: null,
      branchId: input.branchId,
      journalDate: input.journalDate,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      postingType: input.postingType ?? null,
      description: input.description,
      status: 'DRAFT',
      postedAt: null,
      postedBy: null,
      voidedAt: null,
      voidedBy: null,
      voidReason: null,
      reversalOfId: null,
      reverseReason: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      lines: [],
    } as JournalWithLines;
    journal.lines = this.buildLines(input.lines, journal.id);
    this.journals.set(journal.id, journal);
    return journal;
  }

  async list(query: ListQueryDto, filter: JournalListFilter): Promise<PagedResult<JournalWithLines>> {
    const all = [...this.journals.values()].filter(
      (j) =>
        (!filter.branchId || j.branchId === filter.branchId) &&
        (!filter.status || j.status === filter.status) &&
        (!filter.accountId || j.lines.some((l) => l.accountId === filter.accountId)),
    );
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<JournalWithLines | null> {
    return this.journals.get(id) ?? null;
  }

  async findByReference(referenceType: string, referenceId: string, postingType: string): Promise<Journal | null> {
    return (
      [...this.journals.values()].find(
        (j) => j.referenceType === referenceType && j.referenceId === referenceId && j.postingType === postingType,
      ) ?? null
    );
  }

  async replaceLines(id: string, input: ReplaceJournalLinesInput): Promise<JournalWithLines> {
    const journal = this.journals.get(id);
    if (!journal) throw new Error('not found');
    if (input.lines) {
      journal.lines = this.buildLines(input.lines, id);
    }
    if (input.journalDate !== undefined) journal.journalDate = input.journalDate;
    if (input.description !== undefined) journal.description = input.description;
    journal.updatedBy = input.updatedBy;
    journal.updatedAt = new Date();
    return journal;
  }

  async markPosted(id: string, journalNo: string, postedBy: string, postedAt: Date): Promise<JournalWithLines> {
    const journal = this.journals.get(id);
    if (!journal) throw new Error('not found');
    journal.status = 'POSTED';
    journal.journalNo = journalNo;
    journal.postedBy = postedBy;
    journal.postedAt = postedAt;
    return journal;
  }

  async markVoided(id: string, voidedBy: string, voidedAt: Date, voidReason?: string): Promise<JournalWithLines> {
    const journal = this.journals.get(id);
    if (!journal) throw new Error('not found');
    journal.status = 'VOIDED';
    journal.voidedBy = voidedBy;
    journal.voidedAt = voidedAt;
    journal.voidReason = voidReason ?? null;
    return journal;
  }

  async createReversal(
    original: JournalWithLines,
    input: { journalNo: string; journalDate: Date; reason: string; actorUserId: string },
  ): Promise<JournalWithLines> {
    const reversal: JournalWithLines = {
      id: nextFakeUuid(),
      journalNo: input.journalNo,
      branchId: original.branchId,
      journalDate: input.journalDate,
      referenceType: null,
      referenceId: null,
      postingType: null,
      description: `Reversal of ${original.journalNo ?? original.id}: ${input.reason}`,
      status: 'POSTED',
      postedAt: new Date(),
      postedBy: input.actorUserId,
      voidedAt: null,
      voidedBy: null,
      voidReason: null,
      reversalOfId: original.id,
      reverseReason: input.reason,
      createdAt: new Date(),
      createdBy: input.actorUserId,
      updatedAt: new Date(),
      updatedBy: null,
      lines: [],
    } as JournalWithLines;
    reversal.lines = this.buildLines(
      original.lines.map((l) => ({ accountId: l.accountId, debit: Number(l.credit), credit: Number(l.debit), description: l.description ?? undefined })),
      reversal.id,
    );
    this.journals.set(reversal.id, reversal);

    const originalStored = this.journals.get(original.id);
    if (originalStored) {
      originalStored.status = 'REVERSED';
    }

    return reversal;
  }

  async createPosted(input: CreatePostedJournalInput): Promise<JournalWithLines> {
    const journal: JournalWithLines = {
      id: nextFakeUuid(),
      journalNo: input.journalNo,
      branchId: input.branchId,
      journalDate: input.journalDate,
      referenceType: input.referenceType ?? null,
      referenceId: input.referenceId ?? null,
      postingType: input.postingType ?? null,
      description: input.description,
      status: 'POSTED',
      postedAt: new Date(),
      postedBy: input.postedBy,
      voidedAt: null,
      voidedBy: null,
      voidReason: null,
      reversalOfId: null,
      reverseReason: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      lines: [],
    } as JournalWithLines;
    journal.lines = this.buildLines(input.lines, journal.id);
    this.journals.set(journal.id, journal);
    return journal;
  }

  async listPostedLinesByAccount(accountId: string, query: ListQueryDto): Promise<PagedResult<PostedJournalLine>> {
    const all = [...this.journals.values()]
      .filter((j) => j.status === 'POSTED')
      .flatMap((j) =>
        j.lines
          .filter((l) => l.accountId === accountId)
          .map((l) => ({
            journalId: j.id,
            journalNo: j.journalNo ?? '',
            journalDate: j.journalDate,
            debit: Number(l.debit),
            credit: Number(l.credit),
            description: l.description,
          })),
      )
      .sort((a, b) => b.journalDate.getTime() - a.journalDate.getTime());
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async count(): Promise<number> {
    return this.journals.size;
  }

  async findByNumber(journalNo: string): Promise<Journal | null> {
    return [...this.journals.values()].find((j) => j.journalNo === journalNo) ?? null;
  }
}

export class FakeFinancialPeriodRepository implements IFinancialPeriodRepository {
  periods = new Map<string, FinancialPeriod>();

  async create(input: CreateFinancialPeriodInput): Promise<FinancialPeriod> {
    const period: FinancialPeriod = {
      id: nextFakeUuid(),
      branchId: input.branchId,
      periodName: input.periodName,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'OPEN',
      lockedBy: null,
      lockedAt: null,
      closedBy: null,
      closedAt: null,
      reopenedBy: null,
      reopenedAt: null,
      reopenReason: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
    } as FinancialPeriod;
    this.periods.set(period.id, period);
    return period;
  }

  async list(query: ListQueryDto, filter: FinancialPeriodListFilter): Promise<PagedResult<FinancialPeriod>> {
    const all = [...this.periods.values()].filter(
      (p) => (!filter.branchId || p.branchId === filter.branchId) && (!filter.status || p.status === filter.status),
    );
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<FinancialPeriod | null> {
    return this.periods.get(id) ?? null;
  }

  async findOverlapping(branchId: string, startDate: Date, endDate: Date): Promise<FinancialPeriod[]> {
    return [...this.periods.values()].filter(
      (p) =>
        p.branchId === branchId &&
        (p.status === 'OPEN' || p.status === 'LOCKED') &&
        p.startDate.getTime() <= endDate.getTime() &&
        p.endDate.getTime() >= startDate.getTime(),
    );
  }

  async findOpenPeriodForDate(branchId: string, date: Date): Promise<FinancialPeriod | null> {
    return (
      [...this.periods.values()].find(
        (p) => p.branchId === branchId && p.status === 'OPEN' && p.startDate.getTime() <= date.getTime() && p.endDate.getTime() >= date.getTime(),
      ) ?? null
    );
  }
}

export class FakeCashAccountRepository implements ICashAccountRepository {
  cashAccounts = new Map<string, CashAccount>();

  async create(input: CreateCashAccountInput): Promise<CashAccount> {
    const cashAccount: CashAccount = {
      id: nextFakeUuid(),
      branchId: input.branchId,
      code: input.code,
      name: input.name,
      accountType: input.accountType,
      ledgerAccountId: input.ledgerAccountId,
      accountNumber: input.accountNumber ?? null,
      currentBalance: 0 as never,
      isActive: true,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
    } as CashAccount;
    this.cashAccounts.set(cashAccount.id, cashAccount);
    return cashAccount;
  }

  async list(query: ListQueryDto, filter: CashAccountListFilter): Promise<PagedResult<CashAccount>> {
    const all = [...this.cashAccounts.values()].filter(
      (c) =>
        (!filter.branchId || c.branchId === filter.branchId) &&
        (!filter.accountType || c.accountType === filter.accountType) &&
        (filter.isActive === undefined || c.isActive === filter.isActive),
    );
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<CashAccount | null> {
    return this.cashAccounts.get(id) ?? null;
  }

  async findByBranchAndCode(branchId: string, code: string): Promise<CashAccount | null> {
    return [...this.cashAccounts.values()].find((c) => c.branchId === branchId && c.code === code) ?? null;
  }

  async adjustBalance(id: string, delta: number): Promise<CashAccount> {
    const cashAccount = this.cashAccounts.get(id);
    if (!cashAccount) throw new Error('not found');
    cashAccount.currentBalance = (Number(cashAccount.currentBalance) + delta) as never;
    return cashAccount;
  }
}

export class FakeExpenseRepository implements IExpenseRepository {
  expenses = new Map<string, Expense>();

  async create(input: CreateExpenseInput): Promise<Expense> {
    const expense: Expense = {
      id: nextFakeUuid(),
      expenseNo: input.expenseNo,
      branchId: input.branchId,
      expenseDate: input.expenseDate,
      category: input.category,
      expenseAccountId: input.expenseAccountId,
      amount: input.amount as never,
      approvedAmount: null,
      paidAmount: null,
      payeeName: input.payeeName ?? null,
      description: input.description ?? null,
      evidenceUrl: input.evidenceUrl ?? null,
      status: 'DRAFT',
      submittedAt: null,
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      paidBy: null,
      paidAt: null,
      paymentJournalId: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
    } as Expense;
    this.expenses.set(expense.id, expense);
    return expense;
  }

  async list(query: ListQueryDto, filter: ExpenseListFilter): Promise<PagedResult<Expense>> {
    const all = [...this.expenses.values()].filter(
      (e) =>
        (!filter.branchId || e.branchId === filter.branchId) &&
        (!filter.category || e.category === filter.category) &&
        (!filter.status || e.status === filter.status),
    );
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<Expense | null> {
    return this.expenses.get(id) ?? null;
  }

  async update(id: string, input: UpdateExpenseInput): Promise<Expense> {
    const expense = this.expenses.get(id);
    if (!expense) throw new Error('not found');
    if (input.expenseDate !== undefined) expense.expenseDate = input.expenseDate;
    if (input.category !== undefined) expense.category = input.category;
    if (input.expenseAccountId !== undefined) expense.expenseAccountId = input.expenseAccountId;
    if (input.amount !== undefined) expense.amount = input.amount as never;
    if (input.payeeName !== undefined) expense.payeeName = input.payeeName;
    if (input.description !== undefined) expense.description = input.description;
    if (input.evidenceUrl !== undefined) expense.evidenceUrl = input.evidenceUrl;
    expense.updatedBy = input.updatedBy;
    expense.updatedAt = new Date();
    return expense;
  }

  async updateStatus(
    id: string,
    status: Expense['status'],
    fields: Partial<{
      submittedAt: Date;
      approvedBy: string;
      approvedAt: Date;
      approvedAmount: number;
      rejectedBy: string;
      rejectedAt: Date;
      rejectionReason: string;
      paidBy: string;
      paidAt: Date;
      paidAmount: number;
      paymentJournalId: string;
    }>,
  ): Promise<Expense> {
    const expense = this.expenses.get(id);
    if (!expense) throw new Error('not found');
    expense.status = status;
    Object.assign(expense, fields);
    return expense;
  }

  async count(): Promise<number> {
    return this.expenses.size;
  }

  async findByNumber(expenseNo: string): Promise<Expense | null> {
    return [...this.expenses.values()].find((e) => e.expenseNo === expenseNo) ?? null;
  }
}
