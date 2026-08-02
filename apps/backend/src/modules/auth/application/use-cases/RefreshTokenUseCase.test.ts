import { RefreshTokenUseCase } from './RefreshTokenUseCase';
import { JwtService } from '../services/JwtService';
import { FakeAuditService, FakeSessionRepository, FakeUserRepository, buildUser } from '../../../../../tests/fakes/authFakes';
import { testConfig } from '../../../../../tests/fakes/testConfig';
import { hashOpaqueToken } from '../../../../shared/security/opaqueToken';
import { InvalidTokenException } from '../../domain/exceptions/AuthExceptions';

describe('RefreshTokenUseCase', () => {
  const config = testConfig();
  const jwtService = new JwtService(config);

  async function buildSut() {
    const userRepository = new FakeUserRepository();
    const sessionRepository = new FakeSessionRepository();
    const auditService = new FakeAuditService();
    const useCase = new RefreshTokenUseCase(userRepository, sessionRepository, jwtService, auditService, config);
    return { userRepository, sessionRepository, auditService, useCase };
  }

  it('issues a new access token for a valid, non-expired refresh token', async () => {
    const { userRepository, sessionRepository, useCase } = await buildSut();
    const user = buildUser();
    userRepository.seed(user);
    const rawToken = 'valid-refresh-token';
    const session = await sessionRepository.create({
      userId: user.id,
      refreshTokenHash: hashOpaqueToken(rawToken),
      expiredAt: new Date(Date.now() + 60_000),
    });

    const result = await useCase.execute({ refreshToken: rawToken });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).not.toBe(rawToken);
    expect(sessionRepository.sessions.get(session.id)?.refreshTokenHash).not.toBe(hashOpaqueToken(rawToken));
  });

  it('rejects an expired refresh token', async () => {
    const { userRepository, sessionRepository, useCase } = await buildSut();
    const user = buildUser();
    userRepository.seed(user);
    const rawToken = 'expired-refresh-token';
    await sessionRepository.create({
      userId: user.id,
      refreshTokenHash: hashOpaqueToken(rawToken),
      expiredAt: new Date(Date.now() - 1000),
    });

    await expect(useCase.execute({ refreshToken: rawToken })).rejects.toBeInstanceOf(InvalidTokenException);
  });

  it('rejects a revoked/unknown refresh token', async () => {
    const { useCase } = await buildSut();

    await expect(useCase.execute({ refreshToken: 'never-issued' })).rejects.toBeInstanceOf(InvalidTokenException);
  });

  it('revokes the session when a reused (already-rotated) refresh token is presented', async () => {
    const { userRepository, sessionRepository, useCase } = await buildSut();
    const user = buildUser();
    userRepository.seed(user);
    const originalToken = 'original-refresh-token';
    const session = await sessionRepository.create({
      userId: user.id,
      refreshTokenHash: hashOpaqueToken(originalToken),
      expiredAt: new Date(Date.now() + 60_000),
    });

    // First refresh rotates the token away.
    await useCase.execute({ refreshToken: originalToken });
    expect(sessionRepository.sessions.get(session.id)?.revokedAt).toBeNull();

    // Reusing the original (now rotated-out) token must revoke the session.
    await expect(useCase.execute({ refreshToken: originalToken })).rejects.toBeInstanceOf(InvalidTokenException);
    expect(sessionRepository.sessions.get(session.id)?.revokedAt).not.toBeNull();
  });
});
