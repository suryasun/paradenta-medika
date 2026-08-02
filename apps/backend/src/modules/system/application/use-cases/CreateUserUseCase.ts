import { User } from '@prisma/client';
import { AuditContext, IAuditService } from '../../domain/services/IAuditService';
import { PasswordPolicyException } from '../../../auth/domain/exceptions/AuthExceptions';
import { PasswordService } from '../../../auth/application/services/PasswordService';
import { IUserAdminRepository } from '../../domain/repositories/IUserAdminRepository';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository';
import { IUserRoleRepository } from '../../domain/repositories/IUserRoleRepository';
import { UserIdentifierExistsException, RoleNotFoundException } from '../../domain/exceptions/SystemExceptions';

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  roleIds?: string[];
  actorUserId: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-015.md: hash password per the task-010 policy, enforce
 * username/email uniqueness (SYS_USER_IDENTIFIER_EXISTS), optionally assign
 * a default role.
 */
export class CreateUserUseCase {
  constructor(
    private readonly userAdminRepository: IUserAdminRepository,
    private readonly roleRepository: IRoleRepository,
    private readonly userRoleRepository: IUserRoleRepository,
    private readonly passwordService: PasswordService,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: CreateUserInput): Promise<User> {
    const violations = this.passwordService.validatePolicy(input.password, {
      username: input.username,
      email: input.email,
    });
    if (violations.length > 0) {
      throw new PasswordPolicyException(violations);
    }

    const exists = await this.userAdminRepository.existsByUsernameOrEmail(input.username, input.email);
    if (exists) {
      throw new UserIdentifierExistsException();
    }

    if (input.roleIds && input.roleIds.length > 0) {
      for (const roleId of input.roleIds) {
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
          throw new RoleNotFoundException();
        }
      }
    }

    const passwordHash = await this.passwordService.hash(input.password);
    const user = await this.userAdminRepository.create({ username: input.username, email: input.email, passwordHash });

    if (input.roleIds && input.roleIds.length > 0) {
      await this.userRoleRepository.assignRoles(user.id, input.roleIds);
    }

    const auditContext: AuditContext = { userId: input.actorUserId, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('User', user.id, 'CREATE', null, { username: user.username, email: user.email }, auditContext);

    return user;
  }
}
