import { LogoutUseCase } from './LogoutUseCase';
import { FakeAuditService, FakeSessionRepository, buildUser } from '../../../../../tests/fakes/authFakes';

describe('LogoutUseCase', () => {
  it('revokes the session and records an audit entry', async () => {
    const sessionRepository = new FakeSessionRepository();
    const auditService = new FakeAuditService();
    const user = buildUser();
    const session = await sessionRepository.create({
      userId: user.id,
      refreshTokenHash: 'hash',
      expiredAt: new Date(Date.now() + 60_000),
    });
    const useCase = new LogoutUseCase(sessionRepository, auditService);

    await useCase.execute({ sessionId: session.id, userId: user.id });

    expect(sessionRepository.sessions.get(session.id)?.revokedAt).not.toBeNull();
    expect(auditService.records).toHaveLength(1);
    expect(auditService.records[0]).toMatchObject({ entity: 'UserSession', entityId: session.id, action: 'UPDATE' });
  });
});
