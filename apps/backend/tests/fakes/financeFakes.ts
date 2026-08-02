import { Account } from '@prisma/client';
import {
  AccountListFilter,
  CreateAccountInput,
  IAccountRepository,
  UpdateAccountInput,
} from '../../src/modules/finance/domain/repositories/IAccountRepository';
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
