import { DailyClosing, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateDailyClosingInput, DailyClosingListFilter, IDailyClosingRepository } from '../../domain/repositories/IDailyClosingRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'closingDate'] as const;

export class DailyClosingRepository implements IDailyClosingRepository {
  async create(input: CreateDailyClosingInput): Promise<DailyClosing> {
    return prisma.dailyClosing.create({
      data: {
        branchId: input.branchId,
        cashAccountId: input.cashAccountId,
        cashierId: input.cashierId,
        closingDate: input.closingDate,
        expectedBalance: input.expectedBalance,
        countedBalance: input.countedBalance,
        variance: input.variance,
        varianceReason: input.varianceReason,
        denominations: input.denominations as Prisma.InputJsonValue,
        createdBy: input.createdBy,
      },
    });
  }

  async list(query: ListQueryDto, filter: DailyClosingListFilter): Promise<PagedResult<DailyClosing>> {
    const where: Prisma.DailyClosingWhereInput = {
      branchId: filter.branchId,
      cashAccountId: filter.cashAccountId,
      status: filter.status,
      closingDate: filter.dateFrom || filter.dateTo ? { gte: filter.dateFrom, lte: filter.dateTo } : undefined,
    };
    const [items, total] = await Promise.all([
      prisma.dailyClosing.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.dailyClosing.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<DailyClosing | null> {
    return prisma.dailyClosing.findUnique({ where: { id } });
  }

  async findExisting(branchId: string, cashAccountId: string, cashierId: string, closingDate: Date): Promise<DailyClosing | null> {
    return prisma.dailyClosing.findUnique({
      where: { branchId_cashAccountId_cashierId_closingDate: { branchId, cashAccountId, cashierId, closingDate } },
    });
  }

  async approve(id: string, approvedBy: string, approvedAt: Date): Promise<DailyClosing> {
    return prisma.dailyClosing.update({ where: { id }, data: { status: 'APPROVED', approvedBy, approvedAt, updatedBy: approvedBy } });
  }
}
