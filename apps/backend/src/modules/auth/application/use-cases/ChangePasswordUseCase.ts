import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { InvalidCredentialsException, PasswordPolicyException } from '../../domain/exceptions/AuthExceptions';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { PasswordService } from '../services/PasswordService';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-010.md: verify current password, enforce policy
 * (AUTH-056..061), revoke all sessions (AUTH-074), audit (AUTH-076).
 */
export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly passwordService: PasswordService,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const currentValid = await this.passwordService.verify(input.currentPassword, user.passwordHash);
    if (!currentValid) {
      throw new InvalidCredentialsException();
    }

    const violations = this.passwordService.validatePolicy(input.newPassword, {
      username: user.username,
      email: user.email,
    });
    if (violations.length > 0) {
      throw new PasswordPolicyException(violations);
    }

    const newHash = await this.passwordService.hash(input.newPassword);
    await this.userRepository.updatePasswordHash(user.id, newHash);
    await this.userRepository.setRequirePasswordReset(user.id, false);
    await this.sessionRepository.revokeAllForUser(user.id);

    const auditContext: AuditContext = { userId: user.id, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('User', user.id, 'UPDATE', null, { action: 'CHANGE_PASSWORD' }, auditContext);
  }
}
