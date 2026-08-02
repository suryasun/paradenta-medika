import { RevokeUserSessionsUseCase } from './RevokeUserSessionsUseCase';
import { FakeUserAdminRepository } from '../../../../../tests/fakes/systemFakes';
import { FakeAuditService, FakeSessionRepository } from '../../../../../tests/fakes/authFakes';

describe('RevokeUserSessionsUseCase', () => {
  it('revoking all sessions invalidates every active session for that user', async () => {
    const userAdminRepository = new FakeUserAdminRepository();
    const sessionRepository = new FakeSessionRepository();
    const auditService = new FakeAuditService();
    const user = await userAdminRepository.create({ username: 'jdoe', email: 'jdoe@example.com', passwordHash: 'x' });
    const s1 = await sessionRepository.create({ userId: user.id, refreshTokenHash: 'h1', expiredAt: new Date(Date.now() + 60_000) });
    const s2 = await sessionRepository.create({ userId: user.id, refreshTokenHash: 'h2', expiredAt: new Date(Date.now() + 60_000) });
    const useCase = new RevokeUserSessionsUseCase(userAdminRepository, sessionRepository, auditService);

    await useCase.execute({ userId: user.id, actorUserId: 'admin-1' });

    expect(sessionRepository.sessions.get(s1.id)?.revokedAt).not.toBeNull();
    expect(sessionRepository.sessions.get(s2.id)?.revokedAt).not.toBeNull();
    expect(auditService.records).toHaveLength(1);
  });

  it('revoking a specific session only affects that device', async () => {
    const userAdminRepository = new FakeUserAdminRepository();
    const sessionRepository = new FakeSessionRepository();
    const auditService = new FakeAuditService();
    const user = await userAdminRepository.create({ username: 'jdoe', email: 'jdoe@example.com', passwordHash: 'x' });
    const s1 = await sessionRepository.create({ userId: user.id, refreshTokenHash: 'h1', expiredAt: new Date(Date.now() + 60_000) });
    const s2 = await sessionRepository.create({ userId: user.id, refreshTokenHash: 'h2', expiredAt: new Date(Date.now() + 60_000) });
    const useCase = new RevokeUserSessionsUseCase(userAdminRepository, sessionRepository, auditService);

    await useCase.execute({ userId: user.id, sessionId: s1.id, actorUserId: 'admin-1' });

    expect(sessionRepository.sessions.get(s1.id)?.revokedAt).not.toBeNull();
    expect(sessionRepository.sessions.get(s2.id)?.revokedAt).toBeNull();
  });
});
