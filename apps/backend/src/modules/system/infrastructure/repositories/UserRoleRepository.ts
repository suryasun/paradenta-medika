import { Role } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';

export class UserRoleRepository implements IUserRoleRepository {
  async assignRoles(userId: string, roleIds: string[]): Promise<void> {
    await prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId, roleId })),
      skipDuplicates: true,
    });
  }

  async listRolesForUser(userId: string): Promise<Role[]> {
    const userRoles = await prisma.userRole.findMany({ where: { userId }, include: { role: true } });
    return userRoles.map((ur) => ur.role);
  }

  async listAllAssignments(): Promise<{ userId: string; roleId: string }[]> {
    const userRoles = await prisma.userRole.findMany({ select: { userId: true, roleId: true } });
    return userRoles;
  }
}
