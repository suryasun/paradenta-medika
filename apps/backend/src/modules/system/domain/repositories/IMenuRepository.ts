import { Menu } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { PagedResult } from '../../../../shared/http/pagination';

export interface CreateMenuInput {
  menuKey: string;
  label: string;
  route?: string;
  parentId?: string;
  icon?: string;
  order?: number;
  createdBy: string;
}

export type MenuWithPermissionIds = Menu & { permissionIds: string[] };

export interface IMenuRepository {
  create(input: CreateMenuInput): Promise<Menu>;
  list(query: ListQueryDto): Promise<PagedResult<MenuWithPermissionIds>>;
  findById(id: string): Promise<Menu | null>;
  findByKey(menuKey: string): Promise<Menu | null>;
  /** Replaces the full permission set for a menu item (Section 3.2: "menu-permission mapping only", never an authorization grant). */
  replacePermissions(menuId: string, permissionIds: string[]): Promise<MenuWithPermissionIds>;
}
