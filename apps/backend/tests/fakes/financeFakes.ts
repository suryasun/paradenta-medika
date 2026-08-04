import { Account, CashAccount, DailyClosing, DoctorFeeSettlement, DoctorFeeSettlementItem, Expense, FinanceAccountMapping, FinancialPeriod, Journal, JournalLine } from '@prisma/client';
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
  CreateFinanceAccountMappingInput,
  IFinanceAccountMappingRepository,
} from '../../src/modules/finance/domain/repositories/IFinanceAccountMappingRepository';
import {
  CreateExpenseInput,
  ExpenseListFilter,
  IExpenseRepository,
  UpdateExpenseInput,
} from '../../src/modules/finance/domain/repositories/IExpenseRepository';
import {
  CreateDailyClosingInput,
  DailyClosingListFilter,
  IDailyClosingRepository,
} from '../../src/modules/finance/domain/repositories/IDailyClosingRepository';
import {
  CreateDoctorFeeSettlementInput,
  DoctorFeeSettlementListFilter,
  DoctorFeeSettlementWithItems,
  IDoctorFeeSettlementRepository,
} from '../../src/modules/finance/domain/repositories/IDoctorFeeSettlementRepository';
import {
  CashFlowFilter,
  CashFlowRow,
  GeneralLedgerFilter,
  GeneralLedgerRow,
  IFinanceReportRepository,
  IncomeStatementResult,
  ReportDateFilter,
  TrialBalanceRow,
} from '../../src/modules/finance/domain/repositories/IFinanceReportRepository';
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

  async listTemplateAccounts(): Promise<Account[]> {
    return [...this.accounts.values()].filter((a) => a.branchId === null);
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

  async countOpenByBranch(branchId: string): Promise<number> {
    return [...this.journals.values()].filter((j) => j.branchId === branchId && j.status === 'DRAFT').length;
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

  async updateStatus(
    id: string,
    status: FinancialPeriod['status'],
    fields: Partial<{
      lockedBy: string;
      lockedAt: Date;
      closedBy: string;
      closedAt: Date;
      reopenedBy: string;
      reopenedAt: Date;
      reopenReason: string;
    }>,
  ): Promise<FinancialPeriod> {
    const period = this.periods.get(id);
    if (!period) throw new Error('not found');
    period.status = status;
    Object.assign(period, fields);
    return period;
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

export class FakeFinanceAccountMappingRepository implements IFinanceAccountMappingRepository {
  mappings = new Map<string, FinanceAccountMapping>();

  async create(input: CreateFinanceAccountMappingInput): Promise<FinanceAccountMapping> {
    const mapping: FinanceAccountMapping = {
      id: nextFakeUuid(),
      branchId: input.branchId,
      paymentMethodId: input.paymentMethodId,
      cashAccountId: input.cashAccountId,
      revenueAccountId: input.revenueAccountId,
      isActive: true,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
    } as FinanceAccountMapping;
    this.mappings.set(mapping.id, mapping);
    return mapping;
  }

  async list(query: ListQueryDto, filter: { branchId?: string }): Promise<PagedResult<FinanceAccountMapping>> {
    const all = [...this.mappings.values()].filter((m) => !filter.branchId || m.branchId === filter.branchId);
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<FinanceAccountMapping | null> {
    return this.mappings.get(id) ?? null;
  }

  async findByBranchAndPaymentMethod(branchId: string, paymentMethodId: string): Promise<FinanceAccountMapping | null> {
    return [...this.mappings.values()].find((m) => m.branchId === branchId && m.paymentMethodId === paymentMethodId) ?? null;
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

export class FakeDailyClosingRepository implements IDailyClosingRepository {
  closings = new Map<string, DailyClosing>();

  async create(input: CreateDailyClosingInput): Promise<DailyClosing> {
    const closing: DailyClosing = {
      id: nextFakeUuid(),
      branchId: input.branchId,
      cashAccountId: input.cashAccountId,
      cashierId: input.cashierId,
      closingDate: input.closingDate,
      expectedBalance: input.expectedBalance as never,
      countedBalance: input.countedBalance as never,
      variance: input.variance as never,
      varianceReason: input.varianceReason ?? null,
      denominations: (input.denominations ?? null) as never,
      status: 'SUBMITTED',
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
    } as DailyClosing;
    this.closings.set(closing.id, closing);
    return closing;
  }

  async list(query: ListQueryDto, filter: DailyClosingListFilter): Promise<PagedResult<DailyClosing>> {
    const all = [...this.closings.values()].filter(
      (c) =>
        (!filter.branchId || c.branchId === filter.branchId) &&
        (!filter.cashAccountId || c.cashAccountId === filter.cashAccountId) &&
        (!filter.status || c.status === filter.status),
    );
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<DailyClosing | null> {
    return this.closings.get(id) ?? null;
  }

  async findExisting(branchId: string, cashAccountId: string, cashierId: string, closingDate: Date): Promise<DailyClosing | null> {
    return (
      [...this.closings.values()].find(
        (c) =>
          c.branchId === branchId &&
          c.cashAccountId === cashAccountId &&
          c.cashierId === cashierId &&
          c.closingDate.getTime() === closingDate.getTime(),
      ) ?? null
    );
  }

  async approve(id: string, approvedBy: string, approvedAt: Date): Promise<DailyClosing> {
    const closing = this.closings.get(id);
    if (!closing) throw new Error('not found');
    closing.status = 'APPROVED';
    closing.approvedBy = approvedBy;
    closing.approvedAt = approvedAt;
    return closing;
  }
}

export class FakeDoctorFeeSettlementRepository implements IDoctorFeeSettlementRepository {
  settlements = new Map<string, DoctorFeeSettlementWithItems>();
  private itemSequence = 0;

  async create(input: CreateDoctorFeeSettlementInput): Promise<DoctorFeeSettlementWithItems> {
    const settlement: DoctorFeeSettlementWithItems = {
      id: nextFakeUuid(),
      settlementNo: input.settlementNo,
      branchId: input.branchId,
      doctorId: input.doctorId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      feeAccountId: input.feeAccountId,
      grossAmount: input.grossAmount as never,
      deductions: 0 as never,
      netAmount: input.netAmount as never,
      status: 'DRAFT',
      approvedBy: null,
      approvedAt: null,
      paidBy: null,
      paidAt: null,
      paymentJournalId: null,
      createdAt: new Date(),
      createdBy: input.createdBy,
      updatedAt: new Date(),
      updatedBy: null,
      items: input.items.map((item) => {
        this.itemSequence += 1;
        return {
          id: `dfsi-${this.itemSequence}-${nextFakeUuid()}`,
          settlementId: '',
          visitTreatmentId: item.visitTreatmentId,
          amount: item.amount as never,
          createdAt: new Date(),
        } as DoctorFeeSettlementItem;
      }),
    } as DoctorFeeSettlementWithItems;
    settlement.items.forEach((item) => {
      (item as DoctorFeeSettlementItem).settlementId = settlement.id;
    });
    this.settlements.set(settlement.id, settlement);
    return settlement;
  }

  async list(query: ListQueryDto, filter: DoctorFeeSettlementListFilter): Promise<PagedResult<DoctorFeeSettlementWithItems>> {
    const all = [...this.settlements.values()].filter(
      (s) =>
        (!filter.branchId || s.branchId === filter.branchId) &&
        (!filter.doctorId || s.doctorId === filter.doctorId) &&
        (!filter.status || s.status === filter.status),
    );
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async findById(id: string): Promise<DoctorFeeSettlementWithItems | null> {
    return this.settlements.get(id) ?? null;
  }

  async findSettledVisitTreatmentIds(doctorId: string): Promise<string[]> {
    return [...this.settlements.values()]
      .filter((s) => s.doctorId === doctorId)
      .flatMap((s) => s.items.map((i) => i.visitTreatmentId));
  }

  async approve(id: string, approvedBy: string, approvedAt: Date): Promise<DoctorFeeSettlementWithItems> {
    const settlement = this.settlements.get(id);
    if (!settlement) throw new Error('not found');
    settlement.status = 'APPROVED';
    settlement.approvedBy = approvedBy;
    settlement.approvedAt = approvedAt;
    return settlement;
  }

  async markPaid(id: string, paidBy: string, paidAt: Date, paymentJournalId: string): Promise<DoctorFeeSettlementWithItems> {
    const settlement = this.settlements.get(id);
    if (!settlement) throw new Error('not found');
    settlement.status = 'PAID';
    settlement.paidBy = paidBy;
    settlement.paidAt = paidAt;
    settlement.paymentJournalId = paymentJournalId;
    return settlement;
  }

  async count(): Promise<number> {
    return this.settlements.size;
  }

  async findByNumber(settlementNo: string): Promise<DoctorFeeSettlement | null> {
    return [...this.settlements.values()].find((s) => s.settlementNo === settlementNo) ?? null;
  }
}

/** docs/06-tasks/task-172.md..task-175.md (Epic AF): reads directly off the same fake journal/account/cash-account stores used by the rest of Finance's fakes, mirroring FakeWarehouseReportRepository's approach of composing over sibling fakes rather than its own storage. */
export class FakeFinanceReportRepository implements IFinanceReportRepository {
  constructor(
    private readonly journalRepository: FakeJournalRepository,
    private readonly accountRepository: FakeAccountRepository,
    private readonly cashAccountRepository: FakeCashAccountRepository,
  ) {}

  private postedLines(filter: ReportDateFilter, accountId?: string) {
    return [...this.journalRepository.journals.values()]
      .filter(
        (journal) =>
          journal.branchId === filter.branchId &&
          journal.status === 'POSTED' &&
          journal.journalDate.getTime() >= filter.dateFrom.getTime() &&
          journal.journalDate.getTime() <= filter.dateTo.getTime(),
      )
      .flatMap((journal) => journal.lines.filter((line) => !accountId || line.accountId === accountId).map((line) => ({ journal, line })));
  }

  async getTrialBalance(filter: ReportDateFilter): Promise<TrialBalanceRow[]> {
    const byAccount = new Map<string, TrialBalanceRow>();
    for (const { line } of this.postedLines(filter)) {
      const account = this.accountRepository.accounts.get(line.accountId)!;
      const existing = byAccount.get(line.accountId) ?? {
        accountId: line.accountId,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.accountType,
        normalBalance: account.normalBalance,
        debit: 0,
        credit: 0,
        balance: 0,
      };
      existing.debit += Number(line.debit);
      existing.credit += Number(line.credit);
      byAccount.set(line.accountId, existing);
    }
    return [...byAccount.values()].map((row) => ({
      ...row,
      balance: row.normalBalance === 'DEBIT' ? row.debit - row.credit : row.credit - row.debit,
    }));
  }

  async getGeneralLedger(filter: GeneralLedgerFilter, query: ListQueryDto): Promise<PagedResult<GeneralLedgerRow>> {
    const all = this.postedLines(filter, filter.accountId).map(({ journal, line }) => {
      const account = this.accountRepository.accounts.get(line.accountId)!;
      return {
        journalId: journal.id,
        journalNo: journal.journalNo,
        journalDate: journal.journalDate,
        accountId: line.accountId,
        accountCode: account.code,
        accountName: account.name,
        debit: Number(line.debit),
        credit: Number(line.credit),
        description: line.description,
        referenceType: journal.referenceType,
        referenceId: journal.referenceId,
      };
    });
    const start = (query.page - 1) * query.limit;
    return { items: all.slice(start, start + query.limit), total: all.length };
  }

  async getIncomeStatement(filter: ReportDateFilter): Promise<IncomeStatementResult> {
    const revenueMap = new Map<string, { accountId: string; accountCode: string; accountName: string; amount: number }>();
    const expenseMap = new Map<string, { accountId: string; accountCode: string; accountName: string; amount: number }>();
    for (const { line } of this.postedLines(filter)) {
      const account = this.accountRepository.accounts.get(line.accountId)!;
      if (account.accountType !== 'REVENUE' && account.accountType !== 'EXPENSE') continue;
      const isRevenue = account.accountType === 'REVENUE';
      const map = isRevenue ? revenueMap : expenseMap;
      const existing = map.get(line.accountId) ?? { accountId: line.accountId, accountCode: account.code, accountName: account.name, amount: 0 };
      existing.amount += isRevenue ? Number(line.credit) - Number(line.debit) : Number(line.debit) - Number(line.credit);
      map.set(line.accountId, existing);
    }
    const revenue = [...revenueMap.values()];
    const expense = [...expenseMap.values()];
    const totalRevenue = revenue.reduce((sum, row) => sum + row.amount, 0);
    const totalExpense = expense.reduce((sum, row) => sum + row.amount, 0);
    return { revenue, expense, totalRevenue, totalExpense, netResult: totalRevenue - totalExpense };
  }

  async getCashFlow(filter: CashFlowFilter): Promise<CashFlowRow[]> {
    const cashAccounts = [...this.cashAccountRepository.cashAccounts.values()].filter(
      (c) => c.branchId === filter.branchId && (!filter.cashAccountId || c.id === filter.cashAccountId),
    );
    const cashAccountByLedgerId = new Map(cashAccounts.map((c) => [c.ledgerAccountId, c]));
    const rows = new Map<string, CashFlowRow>();
    for (const { journal, line } of this.postedLines(filter)) {
      const cashAccount = cashAccountByLedgerId.get(line.accountId);
      if (!cashAccount) continue;
      const category = journal.postingType ?? 'UNCATEGORIZED';
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
      existing.inflow += Number(line.debit);
      existing.outflow += Number(line.credit);
      rows.set(key, existing);
    }
    return [...rows.values()].map((row) => ({ ...row, net: row.inflow - row.outflow }));
  }
}
