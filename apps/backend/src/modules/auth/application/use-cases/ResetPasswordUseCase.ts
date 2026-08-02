import { AuditContext, IAuditService } from '../../../system/domain/services/IAuditService';
import { hashOpaqueToken } from '../../../../shared/security/opaqueToken';
import { InvalidTokenException, PasswordPolicyException } from '../../domain/exceptions/AuthExceptions';
import { IPasswordResetTokenRepository } from '../../domain/repositories/IPasswordResetTokenRepository';
import { ISessionRepository } from '../../domain/repositories/ISessionRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { PasswordService } from '../services/PasswordService';

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  ipAddress?: string;
  correlationId?: string;
}

/**
 * docs/06-tasks/task-012.md: validate token (exists/not expired/not used),
 * validate policy, persist, mark token used, revoke sessions (AUTH-075),
 * audit (AUTH-076).
 */
export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly passwordService: PasswordService,
    private readonly auditService: IAuditService,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const tokenHash = hashOpaqueToken(input.token);
    const resetToken = await this.passwordResetTokenRepository.findValidByTokenHash(tokenHash);
    if (!resetToken) {
      throw new InvalidTokenException('Reset token is invalid, expired, or already used');
    }

    const user = await this.userRepository.findById(resetToken.userId);
    if (!user) {
      throw new InvalidTokenException();
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
    await this.passwordResetTokenRepository.markUsed(resetToken.id);
    await this.sessionRepository.revokeAllForUser(user.id);

    const auditContext: AuditContext = { userId: user.id, ipAddress: input.ipAddress, correlationId: input.correlationId };
    await this.auditService.record('User', user.id, 'UPDATE', null, { action: 'RESET_PASSWORD' }, auditContext);
  }
}
