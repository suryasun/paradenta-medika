import { Role } from '@prisma/client';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { IUserAdminRepository } from '../../domain/repositories/IUserAdminRepository';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';
import { RoleNotFoundException, UserNotFoundException } from '../../domain/exceptions/SystemExceptions';

export interface AssignRoleToUserInput {
  userId: string;
  roleIds: string[];
  reason?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-019.md: attach one or more roles to a user; the
 * `reason` field is recorded to the Audit Trail alongside the assignment.
 */
export class AssignRoleToUserUseCase {
  constructor(
    private readonly userAdminRepository: IUserAdminRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly userRoleRepository: IUserRoleRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: AssignRoleToUserInput): Promise<Role[]> {
    const user = await this.userAdminRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    for (const roleId of input.roleIds) {
      const role = await this.roleRepository.findById(roleId);
      if (!role) {
        throw new RoleNotFoundException();
      }
    }

    await this.userRoleRepository.assignRoles(input.userId, input.roleIds);
    const roles = await this.userRoleRepository.listRolesForUser(input.userId);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'User',
      input.userId,
      'UPDATE',
      null,
      { action: 'ASSIGN_ROLE', roleIds: input.roleIds, reason: input.reason },
      auditContext,
    );

    return roles;
  }
}
