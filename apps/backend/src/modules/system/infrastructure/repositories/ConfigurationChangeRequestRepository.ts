import { ConfigurationChangeRequest, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  ChangeRequestListFilter,
  CreateChangeRequestInput,
  IConfigurationChangeRequestRepository,
} from '../../domain/repositories/IConfigurationChangeRequestRepository';

const ALLOWED_SORT_FIELDS = ['createdAt'] as const;

export class ConfigurationChangeRequestRepository implements IConfigurationChangeRequestRepository {
  async create(input: CreateChangeRequestInput): Promise<ConfigurationChangeRequest> {
    return prisma.configurationChangeRequest.create({
      data: {
        parameterKey: input.parameterKey,
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        proposedValueType: input.proposedValueType,
        proposedValue: input.proposedValue,
        reason: input.reason,
        isRollback: input.isRollback ?? false,
        rollbackFromVersion: input.rollbackFromVersion,
        requestedBy: input.requestedBy,
      },
    });
  }

  async findById(id: string): Promise<ConfigurationChangeRequest | null> {
    return prisma.configurationChangeRequest.findUnique({ where: { id } });
  }

  async list(query: ListQueryDto, filter: ChangeRequestListFilter): Promise<PagedResult<ConfigurationChangeRequest>> {
    const where: Prisma.ConfigurationChangeRequestWhereInput = {
      parameterKey: filter.parameterKey,
      scopeType: filter.scopeType,
      scopeId: filter.scopeId,
      status: filter.status,
    };
    const [items, total] = await Promise.all([
      prisma.configurationChangeRequest.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.configurationChangeRequest.count({ where }),
    ]);
    return { items, total };
  }

  async markApproved(id: string, approvedBy: string, approvedAt: Date, resultingVersion: number): Promise<ConfigurationChangeRequest> {
    return prisma.configurationChangeRequest.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy, approvedAt, resultingVersion },
    });
  }
}
