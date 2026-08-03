import { Menu } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';
import { CreateMenuInput, IMenuRepository, MenuWithPermissionIds } from '../../domain/repositories/IMenuRepository';

function withPermissionIds(menu: Menu & { menuPermissions: { permissionId: string }[] }): MenuWithPermissionIds {
  const { menuPermissions, ...rest } = menu;
  return { ...rest, permissionIds: menuPermissions.map((mp) => mp.permissionId) };
}

export class MenuRepository implements IMenuRepository {
  async create(input: CreateMenuInput): Promise<Menu> {
    return prisma.menu.create({
      data: {
        menuKey: input.menuKey,
        label: input.label,
        route: input.route,
        parentId: input.parentId,
        icon: input.icon,
        order: input.order ?? 0,
        createdBy: input.createdBy,
      },
    });
  }

  async list(query: ListQueryDto): Promise<PagedResult<MenuWithPermissionIds>> {
    const [items, total] = await Promise.all([
      prisma.menu.findMany({
        include: { menuPermissions: true },
        orderBy: { order: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.menu.count(),
    ]);
    return { items: items.map(withPermissionIds), total };
  }

  async findById(id: string): Promise<Menu | null> {
    return prisma.menu.findUnique({ where: { id } });
  }

  async findByKey(menuKey: string): Promise<Menu | null> {
    return prisma.menu.findUnique({ where: { menuKey } });
  }

  async replacePermissions(menuId: string, permissionIds: string[]): Promise<MenuWithPermissionIds> {
    await prisma.$transaction([
      prisma.menuPermission.deleteMany({ where: { menuId } }),
      prisma.menuPermission.createMany({ data: permissionIds.map((permissionId) => ({ menuId, permissionId })) }),
    ]);
    const menu = await prisma.menu.findUniqueOrThrow({ where: { id: menuId }, include: { menuPermissions: true } });
    return withPermissionIds(menu);
  }
}
