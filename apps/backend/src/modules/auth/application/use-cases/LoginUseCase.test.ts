import { LoginUseCase } from './LoginUseCase';
import { JwtService } from '../services/JwtService';
import { PasswordService } from '../services/PasswordService';
import {
  FakeAuditService,
  FakeSessionRepository,
  FakeUserRepository,
  buildUser,
} from '../../../../../tests/fakes/authFakes';
import { testConfig } from '../../../../../tests/fakes/testConfig';
import { InvalidCredentialsException } from '../../domain/exceptions/AuthExceptions';

describe('LoginUseCase', () => {
  const config = testConfig();
  const passwordService = new PasswordService(config);
  const jwtService = new JwtService(config);

  async function buildSut() {
    const userRepository = new FakeUserRepository();
    const sessionRepository = new FakeSessionRepository();
    const auditService = new FakeAuditService();
    const useCase = new LoginUseCase(userRepository, sessionRepository, passwordService, jwtService, auditService, config);
    return { userRepository, sessionRepository, auditService, useCase };
  }

  it('returns tokens, profile, role, and permission summary for valid credentials', async () => {
    const { userRepository, sessionRepository, auditService, useCase } = await buildSut();
    const passwordHash = await passwordService.hash('Str0ng!Passw0rd');
    const user = buildUser({ username: 'jdoe', email: 'jdoe@example.com', passwordHash });
    userRepository.seed(user, [{ roleCode: 'CASHIER', roleName: 'Cashier', permissionKeys: ['billing.payment'] }]);

    const result = await useCase.execute({ identifier: 'jdoe', password: 'Str0ng!Passw0rd' });

    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
    expect(result.expiresIn).toBeGreaterThan(0);
    expect(result.user).toEqual({ id: user.id, username: 'jdoe', email: 'jdoe@example.com' });
    expect(result.role).toBe('CASHIER');
    expect(result.permissions).toEqual(['billing.payment']);
    expect(sessionRepository.sessions.size).toBe(1);
    expect(auditService.records.some((r) => r.context && r.entityId === user.id)).toBe(true);
  });

  it('returns a generic error and increments the failed-login counter for an invalid password', async () => {
    const { userRepository, useCase } = await buildSut();
    const passwordHash = await passwordService.hash('Str0ng!Passw0rd');
    const user = buildUser({ username: 'jdoe', passwordHash });
    userRepository.seed(user);

    await expect(useCase.execute({ identifier: 'jdoe', password: 'WrongPassword!1' })).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
    expect(userRepository.users.get(user.id)?.failedLoginCount).toBe(1);
  });

  it('returns the same generic error for an unknown identifier (no user enumeration)', async () => {
    const { useCase } = await buildSut();

    await expect(useCase.execute({ identifier: 'nobody', password: 'whatever' })).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
  });

  it('rejects login while the account is locked, without attempting password verification', async () => {
    const { userRepository, useCase } = await buildSut();
    const passwordHash = await passwordService.hash('Str0ng!Passw0rd');
    const user = buildUser({ username: 'jdoe', passwordHash, lockedUntil: new Date(Date.now() + 60_000) });
    userRepository.seed(user);

    await expect(useCase.execute({ identifier: 'jdoe', password: 'Str0ng!Passw0rd' })).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
  });

  it('locks the account after 5 failed attempts', async () => {
    const { userRepository, useCase } = await buildSut();
    const passwordHash = await passwordService.hash('Str0ng!Passw0rd');
    const user = buildUser({ username: 'jdoe', passwordHash });
    userRepository.seed(user);

    for (let i = 0; i < 5; i += 1) {
      await expect(useCase.execute({ identifier: 'jdoe', password: 'wrong' })).rejects.toBeInstanceOf(
        InvalidCredentialsException,
      );
    }

    expect(userRepository.users.get(user.id)?.lockedUntil).not.toBeNull();
  });
});
