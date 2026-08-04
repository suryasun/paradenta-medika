import { Account, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { AccountListFilter, CreateAccountInput, IAccountRepository, UpdateAccountInput } from '../../domain/repositories/IAccountRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'code', 'name'] as const;

export class AccountRepository implements IAccountRepository {
  async create(input: CreateAccountInput): Promise<Account> {
    return prisma.account.create({
      data: {
        branchId: input.branchId,
        code: input.code,
        name: input.name,
        accountType: input.accountType,
        normalBalance: input.normalBalance,
        parentId: input.parentId,
        isPostable: input.isPostable,
        createdBy: input.createdBy,
      },
    });
  }

  async list(query: ListQueryDto, filter: AccountListFilter): Promise<PagedResult<Account>> {
    const where: Prisma.AccountWhereInput = {
      branchId: filter.branchId,
      accountType: filter.accountType,
      parentId: filter.parentId,
      isActive: filter.isActive,
      isPostable: filter.isPostable,
      ...(query.search ? { OR: [{ code: { contains: query.search } }, { name: { contains: query.search } }] } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.account.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.account.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Account | null> {
    return prisma.account.findUnique({ where: { id } });
  }

  async findByBranchAndCode(branchId: string | null, code: string): Promise<Account | null> {
    return prisma.account.findFirst({ where: { branchId, code } });
  }

  async update(id: string, input: UpdateAccountInput): Promise<Account> {
    return prisma.account.update({
      where: { id },
      data: {
        name: input.name,
        accountType: input.accountType,
        normalBalance: input.normalBalance,
        parentId: input.parentId,
        isPostable: input.isPostable,
        updatedBy: input.updatedBy,
      },
    });
  }

  async deactivate(id: string, updatedBy: string): Promise<Account> {
    return prisma.account.update({ where: { id }, data: { isActive: false, updatedBy } });
  }

  async listTemplateAccounts(): Promise<Account[]> {
    return prisma.account.findMany({ where: { branchId: null } });
  }
}
