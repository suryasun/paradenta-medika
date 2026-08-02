import { Permission } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IRolePermissionRepository } from '../../domain/repositories/IRolePermissionRepository';

export class RolePermissionRepository implements IRolePermissionRepository {
  async replacePermissionsForRole(roleId: string, permissionIds: string[]): Promise<void> {
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({ where: { roleId } }),
      prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      }),
    ]);
  }

  async getPermissionsForRole(roleId: string): Promise<Permission[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    return rolePermissions.map((rp) => rp.permission);
  }
}
