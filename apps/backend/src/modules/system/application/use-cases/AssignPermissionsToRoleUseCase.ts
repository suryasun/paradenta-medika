import { Permission } from '@prisma/client';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import { IRolePermissionRepository } from '../../domain/repositories/IRolePermissionRepository';
import { PermissionAssignmentInvalidException, RoleNotFoundException } from '../../domain/exceptions/SystemExceptions';

export interface AssignPermissionsToRoleInput {
  roleId: string;
  permissionIds: string[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-018.md: PATCH /system/roles/{roleId}/permissions
 * replaces the role's permission set.
 */
export class AssignPermissionsToRoleUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly permissionRepository: IPermissionRepository,
    private readonly rolePermissionRepository: IRolePermissionRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: AssignPermissionsToRoleInput): Promise<Permission[]> {
    const role = await this.roleRepository.findById(input.roleId);
    if (!role) {
      throw new RoleNotFoundException();
    }

    const foundPermissions = await this.permissionRepository.findByIds(input.permissionIds);
    if (foundPermissions.length !== input.permissionIds.length) {
      const foundIds = new Set(foundPermissions.map((p) => p.id));
      const missing = input.permissionIds.filter((id) => !foundIds.has(id));
      throw new PermissionAssignmentInvalidException(missing);
    }

    await this.rolePermissionRepository.replacePermissionsForRole(input.roleId, input.permissionIds);

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record(
      'Role',
      input.roleId,
      'UPDATE',
      null,
      { permissionKeys: foundPermissions.map((p) => p.permissionKey) },
      auditContext,
    );

    return foundPermissions;
  }
}
