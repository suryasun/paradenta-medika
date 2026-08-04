import { User } from '@prisma/client';
import { ListQueryDto } from '../../../../shared/http/ListQueryDto';
import { IUserAdminRepository, PagedResult } from '../../domain/repositories/IUserAdminRepository';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';
import { IUserBranchRepository } from '../../domain/repositories/IUserBranchRepository';

export interface ListUsersInput {
  query: ListQueryDto;
  branchId?: string;
  requesterUserId: string;
}

/**
 * docs/06-tasks/task-214.md (Phase 4 Epic BB): unfiltered requests from a
 * cross-branch role (Owner/Administrator/Security Admin, `Role.isCrossBranch`
 * -- task-217) see every branch; unfiltered requests from any other role are
 * automatically intersected with the requester's own branch assignments, per
 * the Actor Matrix -- scope is never silently widened. An explicit branchId
 * is honoured only when it falls within a non-cross-branch requester's own
 * assignments.
 */
export class ListUsersUseCase {
  constructor(
    private readonly userAdminRepository: IUserAdminRepository,
    private readonly userRoleRepository: IUserRoleRepository,
    private readonly userBranchRepository: IUserBranchRepository,
  ) {}

  async execute(input: ListUsersInput): Promise<PagedResult<User>> {
    const requesterRoles = await this.userRoleRepository.listRolesForUser(input.requesterUserId);
    const isCrossBranch = requesterRoles.some((role) => role.isCrossBranch);

    let branchIds: string[] | undefined;
    if (isCrossBranch) {
      branchIds = input.branchId ? [input.branchId] : undefined;
    } else {
      const ownBranchIds = (await this.userBranchRepository.listForUser(input.requesterUserId)).map((assignment) => assignment.branchId);
      branchIds = input.branchId ? ownBranchIds.filter((id) => id === input.branchId) : ownBranchIds;
    }

    return this.userAdminRepository.list(input.query, branchIds ? { branchIds } : undefined);
  }
}
