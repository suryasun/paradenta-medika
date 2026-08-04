import { Role } from '@prisma/client';

export interface UserRoleAssignment {
  userId: string;
  roleId: string;
}

export interface IUserRoleRepository {
  assignRoles(userId: string, roleIds: string[]): Promise<void>;
  listRolesForUser(userId: string): Promise<Role[]>;
  /** docs/06-tasks/task-215.md: every user-role assignment, for the Branch-Scoped Role Assignment Matrix aggregation. */
  listAllAssignments(): Promise<UserRoleAssignment[]>;
}
