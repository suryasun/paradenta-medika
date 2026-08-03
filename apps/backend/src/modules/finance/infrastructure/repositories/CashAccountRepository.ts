import { CashAccount, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CashAccountListFilter, CreateCashAccountInput, ICashAccountRepository } from '../../domain/repositories/ICashAccountRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'code', 'name'] as const;

export class CashAccountRepository implements ICashAccountRepository {
  async create(input: CreateCashAccountInput): Promise<CashAccount> {
    return prisma.cashAccount.create({
      data: {
        branchId: input.branchId,
        code: input.code,
        name: input.name,
        accountType: input.accountType,
        ledgerAccountId: input.ledgerAccountId,
        accountNumber: input.accountNumber,
        createdBy: input.createdBy,
      },
    });
  }

  async list(query: ListQueryDto, filter: CashAccountListFilter): Promise<PagedResult<CashAccount>> {
    const where: Prisma.CashAccountWhereInput = {
      branchId: filter.branchId,
      accountType: filter.accountType,
      isActive: filter.isActive,
    };
    const [items, total] = await Promise.all([
      prisma.cashAccount.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.cashAccount.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<CashAccount | null> {
    return prisma.cashAccount.findUnique({ where: { id } });
  }

  async findByBranchAndCode(branchId: string, code: string): Promise<CashAccount | null> {
    return prisma.cashAccount.findUnique({ where: { branchId_code: { branchId, code } } });
  }

  async adjustBalance(id: string, delta: number): Promise<CashAccount> {
    return prisma.cashAccount.update({ where: { id }, data: { currentBalance: { increment: delta } } });
  }
}
