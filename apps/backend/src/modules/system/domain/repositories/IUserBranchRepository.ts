import { UserBranch } from '@prisma/client';

export interface UserBranchAssignmentInput {
  branchId: string;
  isDefault: boolean;
  effectiveFrom?: Date;
}

export interface IUserBranchRepository {
  replaceAssignments(userId: string, assignments: UserBranchAssignmentInput[], actorUserId: string): Promise<UserBranch[]>;
  listForUser(userId: string): Promise<UserBranch[]>;
  /** docs/06-tasks/task-215.md: every user-branch assignment, for the Branch-Scoped Role Assignment Matrix aggregation. */
  listAllAssignments(): Promise<UserBranch[]>;
}
