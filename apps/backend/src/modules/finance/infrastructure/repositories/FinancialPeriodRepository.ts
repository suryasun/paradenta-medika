import { FinancialPeriod, FinancialPeriodStatus, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateFinancialPeriodInput,
  FinancialPeriodListFilter,
  IFinancialPeriodRepository,
} from '../../domain/repositories/IFinancialPeriodRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'startDate'] as const;

export class FinancialPeriodRepository implements IFinancialPeriodRepository {
  async create(input: CreateFinancialPeriodInput): Promise<FinancialPeriod> {
    return prisma.financialPeriod.create({
      data: {
        branchId: input.branchId,
        periodName: input.periodName,
        startDate: input.startDate,
        endDate: input.endDate,
        createdBy: input.createdBy,
      },
    });
  }

  async list(query: ListQueryDto, filter: FinancialPeriodListFilter): Promise<PagedResult<FinancialPeriod>> {
    const where: Prisma.FinancialPeriodWhereInput = {
      branchId: filter.branchId,
      status: filter.status,
    };
    const [items, total] = await Promise.all([
      prisma.financialPeriod.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.financialPeriod.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<FinancialPeriod | null> {
    return prisma.financialPeriod.findUnique({ where: { id } });
  }

  async findOverlapping(branchId: string, startDate: Date, endDate: Date): Promise<FinancialPeriod[]> {
    return prisma.financialPeriod.findMany({
      where: {
        branchId,
        status: { in: ['OPEN', 'LOCKED'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
  }

  async findOpenPeriodForDate(branchId: string, date: Date): Promise<FinancialPeriod | null> {
    return prisma.financialPeriod.findFirst({
      where: { branchId, status: 'OPEN', startDate: { lte: date }, endDate: { gte: date } },
    });
  }

  async updateStatus(
    id: string,
    status: FinancialPeriodStatus,
    fields: {
      lockedBy?: string;
      lockedAt?: Date;
      closedBy?: string;
      closedAt?: Date;
      reopenedBy?: string;
      reopenedAt?: Date;
      reopenReason?: string;
    },
  ): Promise<FinancialPeriod> {
    return prisma.financialPeriod.update({ where: { id }, data: { status, ...fields } });
  }
}
