import { Permission } from '@prisma/client';

export interface IRolePermissionRepository {
  replacePermissionsForRole(roleId: string, permissionIds: string[]): Promise<void>;
  getPermissionsForRole(roleId: string): Promise<Permission[]>;
}
