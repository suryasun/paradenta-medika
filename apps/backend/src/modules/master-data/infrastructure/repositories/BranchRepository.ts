import { Branch, Prisma } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult, sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateBranchInput, IBranchRepository, UpdateBranchInput } from '../../domain/repositories/IBranchRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'branchCode', 'branchName'] as const;

export class BranchRepository implements IBranchRepository {
  async create(input: CreateBranchInput): Promise<Branch> {
    return prisma.branch.create({ data: input });
  }

  async list(query: ListQueryDto): Promise<PagedResult<Branch>> {
    const where: Prisma.BranchWhereInput = {
      deletedAt: null,
      ...(query.search
        ? { OR: [{ branchCode: { contains: query.search } }, { branchName: { contains: query.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.branch.count({ where }),
    ]);
    return { items, total };
  }

  async findById(id: string): Promise<Branch | null> {
    return prisma.branch.findFirst({ where: { id, deletedAt: null } });
  }

  async findByCode(branchCode: string): Promise<Branch | null> {
    return prisma.branch.findFirst({ where: { branchCode, deletedAt: null } });
  }

  async update(id: string, input: UpdateBranchInput): Promise<Branch> {
    return prisma.branch.update({ where: { id }, data: input });
  }
}
