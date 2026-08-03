import { Account, FinancialPeriod, Journal, JournalLine } from '@prisma/client';
import {
  AccountListFilter,
  CreateAccountInput,
  IAccountRepository,
  UpdateAccountInput,
} from '../../src/modules/finance/domain/repositories/IAccountRepository';
import {
  CreateJournalInput,
  IJournalRepository,
  JournalListFilter,
  JournalWithLines,
  ReplaceJournalLinesInput,
} from '../../src/modules/finance/domain/repositories/IJournalRepository';
import {
  CreateFinancialPeriodInput,
  FinancialPeriodListFilter,
  IFinancialPeriodRepository,
} from '../../src/modules/finance/domain/repositories/IFinancialPeriodRepository';
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
