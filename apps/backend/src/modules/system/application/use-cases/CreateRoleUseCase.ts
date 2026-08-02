import { Role } from '@prisma/client';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { ConflictException } from '../../../../shared/http/exceptions';

export interface CreateRoleInput {
  roleCode: string;
  roleName: string;
  description?: string;
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

export class CreateRoleUseCase {
  constructor(
    private readonly roleRepository: IRoleRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateRoleInput): Promise<Role> {
    const existing = await this.roleRepository.findByCode(input.roleCode);
    if (existing) {
      throw new ConflictException('Role code already exists');
    }

    const role = await this.roleRepository.create({
      roleCode: input.roleCode,
      roleName: input.roleName,
      description: input.description,
    });

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('Role', role.id, 'CREATE', null, { roleCode: role.roleCode, roleName: role.roleName }, auditContext);

    return role;
  }
}
