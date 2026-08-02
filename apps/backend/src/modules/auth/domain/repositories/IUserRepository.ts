import { User } from '@prisma/client';

export interface UserRoleWithPermissions {
  roleCode: string;
  roleName: string;
  permissionKeys: string[];
}

export interface IUserRepository {
  findByIdentifier(identifier: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  getRolesWithPermissions(userId: string): Promise<UserRoleWithPermissions[]>;
  incrementFailedLoginCount(userId: string): Promise<number>;
  resetFailedLoginCount(userId: string): Promise<void>;
  lockUntil(userId: string, until: Date): Promise<void>;
  setRequirePasswordReset(userId: string, required: boolean): Promise<void>;
  updateLastLoginAt(userId: string): Promise<void>;
  updatePasswordHash(userId: string, passwordHash: string): Promise<void>;
}
