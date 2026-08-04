import { UserBranch } from '@prisma/client';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { ISessionRepository } from '../../../auth/domain/repositories/ISessionRepository';
import { IUserAdminRepository } from '../../domain/repositories/IUserAdminRepository';
import { IUserBranchRepository } from '../../domain/repositories/IUserBranchRepository';
import { IBranchRepository } from '../../../master-data/domain/repositories/IBranchRepository';
import { UserNotFoundException, BranchScopeInvalidException, SelfEscalationForbiddenException } from '../../domain/exceptions/SystemExceptions';

export interface AssignUserBranchInput {
  userId: string;
  branchAssignments: Array<{ branchId: string; isDefault: boolean; effectiveFrom?: Date }>;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-210.md (UC-SYS-002 branch-scope half): assigns a
 * user's full set of branch memberships, replacing any prior assignment.
 * Exactly one entry must be flagged isDefault; every branchId must exist
 * and be active; a user may not change their own assignments
 * (no self-escalation). On success, revokes the user's active sessions so
 * their next login carries the refreshed branch scope (UC-SYS-002 step 4).
 */
export class AssignUserBranchUseCase {
  constructor(
    private readonly userAdminRepository: IUserAdminRepository,
    private readonly branchRepository: IBranchRepository,
    private readonly userBranchRepository: IUserBranchRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: AssignUserBranchInput): Promise<UserBranch[]> {
    if (input.userId === input.actorUserId) {
      throw new SelfEscalationForbiddenException();
    }

    const user = await this.userAdminRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    if (input.branchAssignments.length === 0) {
      throw new BranchScopeInvalidException('At least one branch assignment is required');
    }

    const defaultCount = input.branchAssignments.filter((assignment) => assignment.isDefault).length;
    if (defaultCount !== 1) {
      throw new BranchScopeInvalidException('Exactly one branch assignment must be flagged isDefault');
    }

    const branchIds = new Set(input.branchAssignments.map((assignment) => assignment.branchId));
    if (branchIds.size !== input.branchAssignments.length) {
      throw new BranchScopeInvalidException('Duplicate branchId in branchAssignments');
    }

    for (const branchId of branchIds) {
      const branch = await this.branchRepository.findById(branchId);
      if (!branch || !branch.isActive) {
        throw new BranchScopeInvalidException(`Branch ${branchId} does not exist or is not active`);
      }
    }

    const before = await this.userBranchRepository.listForUser(input.userId);
    const assignments = await this.userBranchRepository.replaceAssignments(input.userId, input.branchAssignments, input.actorUserId);
    await this.sessionRepository.revokeAllForUser(input.userId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'User',
      input.userId,
      'UPDATE',
      { branchAssignments: before.map((b) => ({ branchId: b.branchId, isDefault: b.isDefault })) },
      { action: 'ASSIGN_BRANCHES', branchAssignments: assignments.map((b) => ({ branchId: b.branchId, isDefault: b.isDefault })) },
      auditContext,
    );

    return assignments;
  }
}
