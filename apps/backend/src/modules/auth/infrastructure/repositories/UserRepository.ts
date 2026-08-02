import { User } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IUserRepository, UserRoleWithPermissions } from '../../domain/repositories/IUserRepository';

export class UserRepository implements IUserRepository {
  async findByIdentifier(identifier: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [{ username: identifier }, { email: identifier }],
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { id, deletedAt: null } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  }

  async getRolesWithPermissions(userId: string): Promise<UserRoleWithPermissions[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
          },
        },
      },
    });

    return userRoles.map((userRole) => ({
      roleCode: userRole.role.roleCode,
      roleName: userRole.role.roleName,
      permissionKeys: userRole.role.rolePermissions.map((rp) => rp.permission.permissionKey),
    }));
  }

  async incrementFailedLoginCount(userId: string): Promise<number> {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: { increment: 1 } },
    });
    return updated.failedLoginCount;
  }

  async resetFailedLoginCount(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }

  async lockUntil(userId: string, until: Date): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { lockedUntil: until } });
  }

  async setRequirePasswordReset(userId: string, required: boolean): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { requirePasswordReset: required } });
  }

  async updateLastLoginAt(userId: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }
}
