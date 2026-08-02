import { Prisma, TreatmentCategory } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateTreatmentCategoryInput,
  ITreatmentCategoryRepository,
  UpdateTreatmentCategoryInput,
} from '../../domain/repositories/ITreatmentCategoryRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'categoryCode', 'categoryName'] as const;

export class TreatmentCategoryRepository implements ITreatmentCategoryRepository {
  async create(input: CreateTreatmentCategoryInput): Promise<TreatmentCategory> {
    return prisma.treatmentCategory.create({ data: input });
  }

  async list(query: ListQueryDto): Promise<PagedResult<TreatmentCategory>> {
    const where: Prisma.TreatmentCategoryWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { OR: [{ categoryCode: { contains: query.search } }, { categoryName: { contains: query.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.treatmentCategory.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.treatmentCategory.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<TreatmentCategory | null> {
    return prisma.treatmentCategory.findFirst({ where: { id, deletedAt: null } });
  }

  async findByCode(categoryCode: string): Promise<TreatmentCategory | null> {
    return prisma.treatmentCategory.findFirst({ where: { categoryCode, deletedAt: null } });
  }

  async update(id: string, input: UpdateTreatmentCategoryInput): Promise<TreatmentCategory> {
    return prisma.treatmentCategory.update({ where: { id }, data: input });
  }
}
