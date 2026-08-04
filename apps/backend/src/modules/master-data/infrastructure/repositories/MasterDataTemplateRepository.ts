import { Prisma, MasterDataTemplate } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateMasterDataTemplateInput,
  IMasterDataTemplateRepository,
  UpdateMasterDataTemplateInput,
} from '../../domain/repositories/IMasterDataTemplateRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'entityType', 'version'] as const;

export class MasterDataTemplateRepository implements IMasterDataTemplateRepository {
  async create(input: CreateMasterDataTemplateInput): Promise<MasterDataTemplate> {
    return prisma.masterDataTemplate.create({
      data: {
        entityType: input.entityType,
        templatePayload: input.templatePayload as Prisma.InputJsonValue,
        ownerClinicId: input.ownerClinicId,
        version: 1,
      },
    });
  }

  async list(query: ListQueryDto): Promise<PagedResult<MasterDataTemplate>> {
    const where: Prisma.MasterDataTemplateWhereInput = query.search ? { entityType: { contains: query.search } } : {};
    const [items, total] = await Promise.all([
      prisma.masterDataTemplate.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.masterDataTemplate.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<MasterDataTemplate | null> {
    return prisma.masterDataTemplate.findUnique({ where: { id } });
  }

  /** task-221 AC: templatePayload changes bump `version` so already-synced branches can be diffed. */
  async update(id: string, input: UpdateMasterDataTemplateInput): Promise<MasterDataTemplate> {
    return prisma.masterDataTemplate.update({
      where: { id },
      data: {
        ...(input.templatePayload
          ? { templatePayload: input.templatePayload as Prisma.InputJsonValue, version: { increment: 1 } }
          : {}),
      },
    });
  }
}
