import { Prisma, Role } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { sanitizeSortField } from '../../../../shared/http/pagination';
import { CreateRoleInput, IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { PagedResult } from '../../domain/repositories/IUserAdminRepository';

const ALLOWED_SORT_FIELDS = ['createdAt', 'roleCode', 'roleName'] as const;

export class RoleRepository implements IRoleRepository {
  async create(input: CreateRoleInput): Promise<Role> {
    return prisma.role.create({
      data: { roleCode: input.roleCode, roleName: input.roleName, description: input.description },
    });
  }

  async list(query: ListQueryDto): Promise<PagedResult<Role>> {
    const where: Prisma.RoleWhereInput = query.search
      ? { OR: [{ roleCode: { contains: query.search } }, { roleName: { contains: query.search } }] }
      : {};

    const [items, total] = await Promise.all([
      prisma.role.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS)]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.role.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<Role | null> {
    return prisma.role.findUnique({ where: { id } });
  }

  async findByCode(roleCode: string): Promise<Role | null> {
    return prisma.role.findUnique({ where: { roleCode } });
  }

  async updateBranchPolicy(id: string, isCrossBranch: boolean): Promise<Role> {
    return prisma.role.update({ where: { id }, data: { isCrossBranch } });
  }
}
