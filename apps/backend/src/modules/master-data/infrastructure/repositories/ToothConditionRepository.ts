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

  // Phase 4 hardening: see TreatmentRepository.findByCodeForBranch's comment.
  async findByCodeForBranch(conditionCode: string, branchId: string): Promise<ToothCondition | null> {
    const branchSpecific = await prisma.toothCondition.findFirst({ where: { conditionCode, branchId, deletedAt: null } });
    if (branchSpecific) return branchSpecific;
    return prisma.toothCondition.findFirst({ where: { conditionCode, branchId: null, deletedAt: null } });
  }

  async existsForBranch(conditionCode: string, branchId: string | null): Promise<boolean> {
    const match = await prisma.toothCondition.findFirst({ where: { conditionCode, branchId, deletedAt: null } });
    return match !== null;
  }

  async update(id: string, input: UpdateToothConditionInput): Promise<ToothCondition> {
    return prisma.toothCondition.update({ where: { id }, data: input });
  }
}
