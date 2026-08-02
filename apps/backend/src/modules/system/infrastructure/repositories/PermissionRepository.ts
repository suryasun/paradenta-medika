import { Prisma, Permission } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { sanitizeSortField } from '../../../../shared/http/pagination';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { PagedResult } from '../../domain/repositories/IUserAdminRepository';

const ALLOWED_SORT_FIELDS = ['module', 'permissionKey', 'permissionName'] as const;

export class PermissionRepository implements IPermissionRepository {
  async list(query: ListQueryDto): Promise<PagedResult<Permission>> {
    const where: Prisma.PermissionWhereInput = query.search
      ? {
          OR: [
            { permissionKey: { contains: query.search } },
            { permissionName: { contains: query.search } },
            { module: { contains: query.search } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        orderBy: { [sanitizeSortField(query.sort, ALLOWED_SORT_FIELDS, 'module')]: query.order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.permission.count({ where }),
    ]);

    return { items, total };
  }

  async findByIds(ids: string[]): Promise<Permission[]> {
    return prisma.permission.findMany({ where: { id: { in: ids } } });
  }
}
