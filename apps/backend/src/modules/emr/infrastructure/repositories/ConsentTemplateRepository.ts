import { ConsentTemplate, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateConsentTemplateInput,
  IConsentTemplateRepository,
  UpdateConsentTemplateInput,
} from '../../domain/repositories/IConsentTemplateRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'title', 'category'] as const;

export class ConsentTemplateRepository implements IConsentTemplateRepository {
  async create(input: CreateConsentTemplateInput): Promise<ConsentTemplate> {
    return prisma.consentTemplate.create({ data: input });
  }

  async list(query: ListQueryDto): Promise<PagedResult<ConsentTemplate>> {
    const where: Prisma.ConsentTemplateWhereInput = {
      deletedAt: null,
      ...(query.search ? { title: { contains: query.search } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.consentTemplate.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.consentTemplate.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<ConsentTemplate | null> {
    return prisma.consentTemplate.findFirst({ where: { id, deletedAt: null } });
  }

  async update(id: string, input: UpdateConsentTemplateInput): Promise<ConsentTemplate> {
    return prisma.consentTemplate.update({ where: { id }, data: input });
  }
}
