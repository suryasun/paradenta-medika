import { Prisma, SystemParameter } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateSystemParameterInput, ISystemParameterRepository, SystemParameterListFilter } from '../../domain/repositories/ISystemParameterRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'key', 'version'] as const;

export class SystemParameterRepository implements ISystemParameterRepository {
  async create(input: CreateSystemParameterInput): Promise<SystemParameter> {
    const scopeType = input.scopeType;
    const scopeId = input.scopeId ?? null;
    const latest = await prisma.systemParameter.findFirst({
      where: { key: input.key, scopeType, scopeId },
      orderBy: { version: 'desc' },
    });
    return prisma.systemParameter.create({
      data: {
        key: input.key,
        scopeType,
        scopeId,
        valueType: input.valueType,
        value: input.value,
        version: (latest?.version ?? 0) + 1,
        isHighRisk: input.isHighRisk ?? false,
        effectiveFrom: input.effectiveFrom ?? new Date(),
        changeReason: input.changeReason,
        createdBy: input.createdBy,
      },
    });
  }

  async list(query: ListQueryDto, filter: SystemParameterListFilter): Promise<PagedResult<SystemParameter>> {
    const where: Prisma.SystemParameterWhereInput = {
      key: filter.key,
      scopeType: filter.scopeType,
      scopeId: filter.scopeId,
    };
    const [items, total] = await Promise.all([
      prisma.systemParameter.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.systemParameter.count({ where }),
    ]);
    return { items, total };
  }

  async findLatest(key: string, scopeType: string, scopeId?: string): Promise<SystemParameter | null> {
    return prisma.systemParameter.findFirst({
      where: { key, scopeType, scopeId: scopeId ?? null },
      orderBy: { version: 'desc' },
    });
  }

  async findVersions(key: string, query: ListQueryDto): Promise<PagedResult<SystemParameter>> {
    const where: Prisma.SystemParameterWhereInput = { key };
    const [items, total] = await Promise.all([
      prisma.systemParameter.findMany({
        where,
        orderBy: { version: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.systemParameter.count({ where }),
    ]);
    return { items, total };
  }

  async findByKeyAndVersion(key: string, scopeType: string, scopeId: string | undefined, version: number): Promise<SystemParameter | null> {
    return prisma.systemParameter.findFirst({ where: { key, scopeType, scopeId: scopeId ?? null, version } });
  }
}
