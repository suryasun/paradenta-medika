import { UserBranch } from '@prisma/client';
import { prisma } from '../../../../shared/infrastructure/prisma';
import { IUserBranchRepository, UserBranchAssignmentInput } from '../../domain/repositories/IUserBranchRepository';

export class UserBranchRepository implements IUserBranchRepository {
  async replaceAssignments(userId: string, assignments: UserBranchAssignmentInput[], actorUserId: string): Promise<UserBranch[]> {
    return prisma.$transaction(async (tx) => {
      await tx.userBranch.deleteMany({ where: { userId } });
      await tx.userBranch.createMany({
        data: assignments.map((assignment) => ({
          userId,
          branchId: assignment.branchId,
          isDefault: assignment.isDefault,
          effectiveFrom: assignment.effectiveFrom ?? null,
          createdBy: actorUserId,
        })),
      });
      return tx.userBranch.findMany({ where: { userId } });
    });
  }

  async listForUser(userId: string): Promise<UserBranch[]> {
    return prisma.userBranch.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
  }

  async listAllAssignments(): Promise<UserBranch[]> {
    return prisma.userBranch.findMany();
  }
}
