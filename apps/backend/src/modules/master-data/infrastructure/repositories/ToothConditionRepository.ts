import { Prisma, ToothCondition } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateToothConditionInput,
  IToothConditionRepository,
  UpdateToothConditionInput,
} from '../../domain/repositories/IToothConditionRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'conditionCode', 'conditionName', 'category'] as const;

export class ToothConditionRepository implements IToothConditionRepository {
  async create(input: CreateToothConditionInput): Promise<ToothCondition> {
    return prisma.toothCondition.create({ data: input });
  }

  async list(query: ListQueryDto): Promise<PagedResult<ToothCondition>> {
    const where: Prisma.ToothConditionWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { OR: [{ conditionCode: { contains: query.search } }, { conditionName: { contains: query.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.toothCondition.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.toothCondition.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<ToothCondition | null> {
    return prisma.toothCondition.findFirst({ where: { id, deletedAt: null } });
  }

  async findByCode(conditionCode: string): Promise<ToothCondition | null> {
    return prisma.toothCondition.findFirst({ where: { conditionCode, deletedAt: null } });
  }

  async update(id: string, input: UpdateToothConditionInput): Promise<ToothCondition> {
    return prisma.toothCondition.update({ where: { id }, data: input });
  }
}
