import { generateOpaqueToken, hashOpaqueToken } from '../../../../shared/security/opaqueToken';
import { IPasswordResetTokenRepository } from '../../domain/repositories/IPasswordResetTokenRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { IEmailSender } from '../services/IEmailSender';

/**
 * docs/06-tasks/task-011.md: reset token expiry duration is not given an
 * exact value in the SAD beyond "must have an expiration time" (AUTH-073) --
 * NOT DEFINED IN SAD precisely; 1 hour is used as a conservative default.
 */
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export interface ForgotPasswordInput {
  identifier: string;
}

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    private readonly emailSender: IEmailSender,
  ) {}

  /**
   * Always resolves; never reveals whether the identifier matched a user
   * (docs/06-tasks/task-011.md Security Impact: no user enumeration).
   */
  async execute(input: ForgotPasswordInput): Promise<void> {
    const user = await this.userRepository.findByIdentifier(input.identifier);
    if (!user) {
      return;
    }

    const token = generateOpaqueToken();
    const tokenHash = hashOpaqueToken(token);
    const expiredAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.passwordResetTokenRepository.create(user.id, tokenHash, expiredAt);
    await this.emailSender.send(
      user.email,
      'Parakita - Password Reset Request',
      `Use this token to reset your password: ${token} (expires in 1 hour).`,
    );
  }
}
