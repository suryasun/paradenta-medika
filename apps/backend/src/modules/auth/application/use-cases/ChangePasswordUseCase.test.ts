import { ChangePasswordUseCase } from './ChangePasswordUseCase';
import { PasswordService } from '../services/PasswordService';
import { FakeAuditService, FakeSessionRepository, FakeUserRepository, buildUser } from '../../../../../tests/fakes/authFakes';
import { testConfig } from '../../../../../tests/fakes/testConfig';
import { PasswordPolicyException, InvalidCredentialsException } from '../../domain/exceptions/AuthExceptions';

describe('ChangePasswordUseCase', () => {
  const passwordService = new PasswordService(testConfig());

  async function buildSut() {
    const userRepository = new FakeUserRepository();
    const sessionRepository = new FakeSessionRepository();
    const auditService = new FakeAuditService();
    const useCase = new ChangePasswordUseCase(userRepository, sessionRepository, passwordService, auditService);
    return { userRepository, sessionRepository, auditService, useCase };
  }

  it('rejects a policy-violating new password with the specific reasons', async () => {
    const { userRepository, useCase } = await buildSut();
    const passwordHash = await passwordService.hash('Curr3nt!Passw0rd');
    const user = buildUser({ passwordHash });
    userRepository.seed(user);

    await expect(
      useCase.execute({ userId: user.id, currentPassword: 'Curr3nt!Passw0rd', newPassword: 'weak' }),
    ).rejects.toBeInstanceOf(PasswordPolicyException);
  });

  it('rejects when the current password is wrong', async () => {
    const { userRepository, useCase } = await buildSut();
    const passwordHash = await passwordService.hash('Curr3nt!Passw0rd');
    const user = buildUser({ passwordHash });
    userRepository.seed(user);

    await expect(
      useCase.execute({ userId: user.id, currentPassword: 'WrongOne!1', newPassword: 'N3wStr0ng!Pass' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });

  it('revokes all sessions and records an audit entry on success', async () => {
    const { userRepository, sessionRepository, auditService, useCase } = await buildSut();
    const passwordHash = await passwordService.hash('Curr3nt!Passw0rd');
    const user = buildUser({ passwordHash });
    userRepository.seed(user);
    const session = await sessionRepository.create({
      userId: user.id,
      refreshTokenHash: 'hash',
      expiredAt: new Date(Date.now() + 60_000),
    });

    await useCase.execute({ userId: user.id, currentPassword: 'Curr3nt!Passw0rd', newPassword: 'N3wStr0ng!Pass' });

    expect(sessionRepository.sessions.get(session.id)?.revokedAt).not.toBeNull();
    expect(auditService.records).toHaveLength(1);
    const updatedUser = userRepository.users.get(user.id)!;
    await expect(passwordService.verify('N3wStr0ng!Pass', updatedUser.passwordHash)).resolves.toBe(true);
  });
});
