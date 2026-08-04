import { Role } from '@prisma/client';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { RoleNotFoundException, RoleSystemProtectedException } from '../../domain/exceptions/SystemExceptions';

export interface UpdateRoleBranchPolicyInput {
  roleId: string;
  isCrossBranch: boolean;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-217.md: flips a role's cross-branch policy, read live
 * by task-216's BranchScopeGuard on every request (no cache to invalidate).
 * Built-in roles reject this change with SYS_ROLE_SYSTEM_PROTECTED --
 * Owner/Administrator's cross-branch status is a fixed platform invariant,
 * not an editable policy.
 */
export class UpdateRoleBranchPolicyUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: UpdateRoleBranchPolicyInput): Promise<Role> {
    const role = await this.roleRepository.findById(input.roleId);
    if (!role) {
      throw new RoleNotFoundException();
    }

    if (role.isSystem) {
      throw new RoleSystemProtectedException();
    }

    const updated = await this.roleRepository.updateBranchPolicy(input.roleId, input.isCrossBranch);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Role',
      input.roleId,
      'UPDATE',
      { isCrossBranch: role.isCrossBranch },
      { isCrossBranch: updated.isCrossBranch },
      auditContext,
    );

    return updated;
  }
}
