import { FinanceAccountMapping, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateFinanceAccountMappingInput, IFinanceAccountMappingRepository } from '../../domain/repositories/IFinanceAccountMappingRepository';

const ALLOWED_SORT_FIELDS = ['createdAt'] as const;

export class FinanceAccountMappingRepository implements IFinanceAccountMappingRepository {
  async create(input: CreateFinanceAccountMappingInput): Promise<FinanceAccountMapping> {
    return prisma.financeAccountMapping.create({
      data: {
        branchId: input.branchId,
        paymentMethodId: input.paymentMethodId,
        cashAccountId: input.cashAccountId,
        revenueAccountId: input.revenueAccountId,
        createdBy: input.createdBy,
      },
    });
  }

  async list(query: ListQueryDto, filter: { branchId?: string }): Promise<PagedResult<FinanceAccountMapping>> {
    const where: Prisma.FinanceAccountMappingWhereInput = { branchId: filter.branchId };
    const [items, total] = await Promise.all([
      prisma.financeAccountMapping.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.financeAccountMapping.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<FinanceAccountMapping | null> {
    return prisma.financeAccountMapping.findUnique({ where: { id } });
  }

  async findByBranchAndPaymentMethod(branchId: string, paymentMethodId: string): Promise<FinanceAccountMapping | null> {
    return prisma.financeAccountMapping.findUnique({ where: { branchId_paymentMethodId: { branchId, paymentMethodId } } });
  }
}
