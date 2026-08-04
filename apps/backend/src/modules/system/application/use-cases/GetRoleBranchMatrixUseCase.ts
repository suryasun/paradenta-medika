import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';
import { IUserBranchRepository } from '../../domain/repositories/IUserBranchRepository';
import { IBranchRepository } from '../../../master-data/domain/repositories/IBranchRepository';

export interface RoleBranchMatrixEntry {
  roleId: string;
  roleName: string;
  branchId: string;
  branchName: string;
  userCount: number;
}

const FETCH_ALL_QUERY = { page: 1, limit: 100, sort: 'createdAt', order: 'desc' as const };

/**
 * docs/06-tasks/task-215.md: aggregates role x branch x user-count across
 * the whole platform. A user contributes one count to every (role, branch)
 * pair they concurrently hold -- e.g. a user with roles [DOCTOR, CASHIER]
 * assigned to branches [A, B] contributes to all four (role, branch) pairs,
 * satisfying the AC that the matrix reflects concurrent multi-branch
 * assignments for a single user.
 */
export class GetRoleBranchMatrixUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly branchRepository: IBranchRepository,
    private readonly userRoleRepository: IUserRoleRepository,
    private readonly userBranchRepository: IUserBranchRepository,
  ) {}

  async execute(): Promise<RoleBranchMatrixEntry[]> {
    const [{ items: roles }, { items: branches }, roleAssignments, branchAssignments] = await Promise.all([
      this.roleRepository.list(FETCH_ALL_QUERY),
      this.branchRepository.list(FETCH_ALL_QUERY),
      this.userRoleRepository.listAllAssignments(),
      this.userBranchRepository.listAllAssignments(),
    ]);

    const rolesByUser = new Map<string, Set<string>>();
    for (const assignment of roleAssignments) {
      const roleIds = rolesByUser.get(assignment.userId) ?? new Set<string>();
      roleIds.add(assignment.roleId);
      rolesByUser.set(assignment.userId, roleIds);
    }

    const branchesByUser = new Map<string, Set<string>>();
    for (const assignment of branchAssignments) {
      const branchIds = branchesByUser.get(assignment.userId) ?? new Set<string>();
      branchIds.add(assignment.branchId);
      branchesByUser.set(assignment.userId, branchIds);
    }

    const countsByPair = new Map<string, number>();
    for (const [userId, roleIds] of rolesByUser) {
      const branchIds = branchesByUser.get(userId);
      if (!branchIds) continue;
      for (const roleId of roleIds) {
        for (const branchId of branchIds) {
          const pairKey = `${roleId}::${branchId}`;
          countsByPair.set(pairKey, (countsByPair.get(pairKey) ?? 0) + 1);
        }
      }
    }

    const entries: RoleBranchMatrixEntry[] = [];
    for (const role of roles) {
      for (const branch of branches) {
        const userCount = countsByPair.get(`${role.id}::${branch.id}`) ?? 0;
        if (userCount > 0) {
          entries.push({ roleId: role.id, roleName: role.roleName, branchId: branch.id, branchName: branch.branchName, userCount });
        }
      }
    }

    return entries;
  }
}
