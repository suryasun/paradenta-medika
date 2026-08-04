import { IUserRoleRepository } from '../../../system/domain/repositories/IUserRoleRepository';
import { IUserBranchRepository } from '../../../system/domain/repositories/IUserBranchRepository';
import { ReportScopeForbiddenException } from '../../domain/exceptions/ReportExceptions';

/**
 * docs/06-tasks/task-218.md/task-219.md/task-220.md (Phase 4 Epics BD/BE/BF):
 * TC-RPT-008 ("Scope di-intersect/ditolak sesuai user assignment") --
 * previously undeferrable per DashboardMetricAssembler's own comment
 * ("per-user branch assignment does not exist until Phase 4"), now
 * enforceable via task-210's system_user_branches. Cross-branch roles
 * (Role.isCrossBranch -- task-217) bypass entirely, same as
 * BranchScopeGuard (task-216); this is the read-side equivalent for
 * Reporting's own use cases rather than route middleware, since these
 * endpoints validate a *set* of requested branchIds, not a single path
 * param the guard's extractor shape assumes.
 */
export class BranchAuthorizationService {
  constructor(
    private readonly userRoleRepository: IUserRoleRepository,
    private readonly userBranchRepository: IUserBranchRepository,
  ) {}

  private async isCrossBranch(requesterUserId: string): Promise<boolean> {
    const roles = await this.userRoleRepository.listRolesForUser(requesterUserId);
    return roles.some((role) => role.isCrossBranch);
  }

  /** Single-branch check (task-218): rejects if the branch is outside a non-cross-branch requester's assignment. */
  async assertBranchInScope(requesterUserId: string, branchId: string): Promise<void> {
    if (await this.isCrossBranch(requesterUserId)) {
      return;
    }
    const ownAssignments = await this.userBranchRepository.listForUser(requesterUserId);
    if (!ownAssignments.some((assignment) => assignment.branchId === branchId)) {
      throw new ReportScopeForbiddenException();
    }
  }

  /**
   * Multi-branch check (task-219/220): rejects the whole request
   * (RPT_SCOPE_FORBIDDEN) if ANY requested branchId falls outside a
   * non-cross-branch requester's assignment -- an explicit, auditable
   * error per this task's own Security Impact wording, not a silent
   * narrowing of the requested set.
   */
  async assertBranchesInScope(requesterUserId: string, branchIds: string[]): Promise<void> {
    if (await this.isCrossBranch(requesterUserId)) {
      return;
    }
    const ownAssignments = await this.userBranchRepository.listForUser(requesterUserId);
    const ownBranchIds = new Set(ownAssignments.map((assignment) => assignment.branchId));
    if (branchIds.some((branchId) => !ownBranchIds.has(branchId))) {
      throw new ReportScopeForbiddenException();
    }
  }
}
