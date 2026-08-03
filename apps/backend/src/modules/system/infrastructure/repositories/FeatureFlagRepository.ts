import { FeatureFlag, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateFeatureFlagInput,
  FeatureFlagListFilter,
  IFeatureFlagRepository,
  UpdateFeatureFlagInput,
} from '../../domain/repositories/IFeatureFlagRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'flagKey'] as const;

export class FeatureFlagRepository implements IFeatureFlagRepository {
  async create(input: CreateFeatureFlagInput): Promise<FeatureFlag> {
    return prisma.featureFlag.create({
      data: {
        flagKey: input.flagKey,
        ownerModule: input.ownerModule,
        targetScope: input.targetScope,
        enabled: input.enabled ?? false,
        riskClass: input.riskClass ?? 'standard',
        effectiveFrom: input.effectiveFrom,
        effectiveUntil: input.effectiveUntil,
        reviewDate: input.reviewDate,
        description: input.description,
        createdBy: input.createdBy,
      },
    });
  }

  async list(query: ListQueryDto, filter: FeatureFlagListFilter): Promise<PagedResult<FeatureFlag>> {
    const where: Prisma.FeatureFlagWhereInput = { ownerModule: filter.ownerModule, enabled: filter.enabled };
    const [items, total] = await Promise.all([
      prisma.featureFlag.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.featureFlag.count({ where }),
    ]);
    return { items, total };
  }

  async findByKey(flagKey: string): Promise<FeatureFlag | null> {
    return prisma.featureFlag.findUnique({ where: { flagKey } });
  }

  async update(flagKey: string, input: UpdateFeatureFlagInput): Promise<FeatureFlag> {
    return prisma.featureFlag.update({
      where: { flagKey },
      data: {
        targetScope: input.targetScope,
        enabled: input.enabled,
        effectiveFrom: input.effectiveFrom,
        effectiveUntil: input.effectiveUntil,
        reviewDate: input.reviewDate,
        description: input.description,
        updatedBy: input.updatedBy,
      },
    });
  }
}
