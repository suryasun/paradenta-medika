import { UserBranch } from '@prisma/client';
import { IUserAdminRepository } from '../../domain/repositories/IUserAdminRepository';
import { IUserBranchRepository } from '../../domain/repositories/IUserBranchRepository';
import { UserNotFoundException } from '../../domain/exceptions/SystemExceptions';
import { AuthorizationException } from '../../../../shared/http/exceptions';

export interface ListUserBranchesInput {
  userId: string;
  requesterUserId: string;
  requesterPermissionKeys: string[];
}

/**
 * docs/06-tasks/task-211.md: "A user can always read their own branch list
 * regardless of system.user.read" -- this business rule lives here rather
 * than in route middleware since requirePermission has no self-bypass.
 */
export class ListUserBranchesUseCase {
  constructor(
    private readonly userAdminRepository: IUserAdminRepository,
    private readonly userBranchRepository: IUserBranchRepository,
  ) {}

  async execute(input: ListUserBranchesInput): Promise<UserBranch[]> {
    const isSelf = input.userId === input.requesterUserId;
    if (!isSelf && !input.requesterPermissionKeys.includes('system.user.read')) {
      throw new AuthorizationException('Insufficient permission: system.user.read', 'FORBIDDEN');
    }

    const user = await this.userAdminRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    return this.userBranchRepository.listForUser(input.userId);
  }
}
