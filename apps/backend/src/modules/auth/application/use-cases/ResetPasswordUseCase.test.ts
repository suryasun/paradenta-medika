import { ResetPasswordUseCase } from './ResetPasswordUseCase';
import { PasswordService } from '../services/PasswordService';
import {
  FakeAuditService,
  FakePasswordResetTokenRepository,
  FakeSessionRepository,
  FakeUserRepository,
  buildUser,
} from '../../../../../tests/fakes/authFakes';
import { testConfig } from '../../../../../tests/fakes/testConfig';
import { hashOpaqueToken } from '../../../../shared/security/opaqueToken';
import { InvalidTokenException, PasswordPolicyException } from '../../domain/exceptions/AuthExceptions';

describe('ResetPasswordUseCase', () => {
  const passwordService = new PasswordService(testConfig());

  async function buildSut() {
    const userRepository = new FakeUserRepository();
    const tokenRepository = new FakePasswordResetTokenRepository();
    const sessionRepository = new FakeSessionRepository();
    const auditService = new FakeAuditService();
    const useCase = new ResetPasswordUseCase(userRepository, tokenRepository, sessionRepository, passwordService, auditService);
    return { userRepository, tokenRepository, sessionRepository, auditService, useCase };
  }

  it('resets the password and revokes all sessions for a valid, unexpired token', async () => {
    const { userRepository, tokenRepository, sessionRepository, useCase } = await buildSut();
    const user = buildUser();
    userRepository.seed(user);
    const rawToken = 'reset-token';
    await tokenRepository.create(user.id, hashOpaqueToken(rawToken), new Date(Date.now() + 60_000));
    const session = await sessionRepository.create({
      userId: user.id,
      refreshTokenHash: 'hash',
      expiredAt: new Date(Date.now() + 60_000),
    });

    await useCase.execute({ token: rawToken, newPassword: 'N3wStr0ng!Pass' });

    const updatedUser = userRepository.users.get(user.id)!;
    await expect(passwordService.verify('N3wStr0ng!Pass', updatedUser.passwordHash)).resolves.toBe(true);
    expect(sessionRepository.sessions.get(session.id)?.revokedAt).not.toBeNull();
  });

  it('rejects an expired token', async () => {
    const { userRepository, tokenRepository, useCase } = await buildSut();
    const user = buildUser();
    userRepository.seed(user);
    const rawToken = 'expired-token';
    await tokenRepository.create(user.id, hashOpaqueToken(rawToken), new Date(Date.now() - 1000));

    await expect(useCase.execute({ token: rawToken, newPassword: 'N3wStr0ng!Pass' })).rejects.toBeInstanceOf(
      InvalidTokenException,
    );
  });

  it('rejects an already-used token', async () => {
    const { userRepository, tokenRepository, useCase } = await buildSut();
    const user = buildUser();
    userRepository.seed(user);
    const rawToken = 'used-token';
    const token = await tokenRepository.create(user.id, hashOpaqueToken(rawToken), new Date(Date.now() + 60_000));
    await tokenRepository.markUsed(token.id);

    await expect(useCase.execute({ token: rawToken, newPassword: 'N3wStr0ng!Pass' })).rejects.toBeInstanceOf(
      InvalidTokenException,
    );
  });

  it('rejects a policy-violating new password', async () => {
    const { userRepository, tokenRepository, useCase } = await buildSut();
    const user = buildUser();
    userRepository.seed(user);
    const rawToken = 'reset-token-2';
    await tokenRepository.create(user.id, hashOpaqueToken(rawToken), new Date(Date.now() + 60_000));

    await expect(useCase.execute({ token: rawToken, newPassword: 'weak' })).rejects.toBeInstanceOf(
      PasswordPolicyException,
    );
  });
});
