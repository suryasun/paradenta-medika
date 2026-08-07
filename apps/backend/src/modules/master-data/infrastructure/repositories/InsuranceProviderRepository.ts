import { InsuranceProvider, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import {
  CreateInsuranceProviderInput,
  IInsuranceProviderRepository,
  UpdateInsuranceProviderInput,
} from '../../domain/repositories/IInsuranceProviderRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'providerName'] as const;

export class InsuranceProviderRepository implements IInsuranceProviderRepository {
  async create(input: CreateInsuranceProviderInput): Promise<InsuranceProvider> {
    return prisma.insuranceProvider.create({ data: input });
  }

  async list(query: ListQueryDto): Promise<PagedResult<InsuranceProvider>> {
    const where: Prisma.InsuranceProviderWhereInput = {
      deletedAt: null,
      ...(query.search ? { providerName: { contains: query.search } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.insuranceProvider.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.insuranceProvider.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<InsuranceProvider | null> {
    return prisma.insuranceProvider.findFirst({ where: { id, deletedAt: null } });
  }

  async update(id: string, input: UpdateInsuranceProviderInput): Promise<InsuranceProvider> {
    return prisma.insuranceProvider.update({ where: { id }, data: input });
  }
}
