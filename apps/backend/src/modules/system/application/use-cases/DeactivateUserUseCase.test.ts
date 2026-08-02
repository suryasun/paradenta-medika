import { DeactivateUserUseCase } from './DeactivateUserUseCase';
import { FakeUserAdminRepository } from '../../../../../tests/fakes/systemFakes';
import { FakeAuditService, FakeSessionRepository } from '../../../../../tests/fakes/authFakes';

describe('DeactivateUserUseCase', () => {
  it('deactivates the user and revokes all active sessions', async () => {
    const userAdminRepository = new FakeUserAdminRepository();
    const sessionRepository = new FakeSessionRepository();
    const auditService = new FakeAuditService();
    const user = await userAdminRepository.create({ username: 'jdoe', email: 'jdoe@example.com', passwordHash: 'x' });
    const session = await sessionRepository.create({ userId: user.id, refreshTokenHash: 'h', expiredAt: new Date(Date.now() + 60_000) });
    const useCase = new DeactivateUserUseCase(userAdminRepository, sessionRepository, auditService);

    const updated = await useCase.execute({ userId: user.id, actorUserId: 'admin-1' });

    expect(updated.status).toBe('INACTIVE');
    expect(sessionRepository.sessions.get(session.id)?.revokedAt).not.toBeNull();
    expect(auditService.records).toHaveLength(1);
  });
});
