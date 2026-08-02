import { Clinic, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';
import { sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateClinicInput, IClinicRepository, UpdateClinicInput } from '../../domain/repositories/IClinicRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'clinicCode', 'clinicName'] as const;

export class ClinicRepository implements IClinicRepository {
  async create(input: CreateClinicInput): Promise<Clinic> {
    return prisma.clinic.create({ data: input });
  }

  async list(query: ListQueryDto): Promise<PagedResult<Clinic>> {
    const where: Prisma.ClinicWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { OR: [{ clinicCode: { contains: query.search } }, { clinicName: { contains: query.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.clinic.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.clinic.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Clinic | null> {
    return prisma.clinic.findFirst({ where: { id, deletedAt: null } });
  }

  async findByCode(clinicCode: string): Promise<Clinic | null> {
    return prisma.clinic.findFirst({ where: { clinicCode, deletedAt: null } });
  }

  async update(id: string, input: UpdateClinicInput): Promise<Clinic> {
    return prisma.clinic.update({ where: { id }, data: input });
  }
}
