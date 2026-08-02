import { Role } from '@prisma/client';

export interface IUserRoleRepository {
  assignRoles(userId: string, roleIds: string[]): Promise<void>;
  listRolesForUser(userId: string): Promise<Role[]>;
}
