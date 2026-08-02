import express from 'express';
import request from 'supertest';
import { createAuthenticateMiddleware } from './authenticate';
import { JwtService } from '../../application/services/JwtService';
import { correlationIdMiddleware } from '../../../../shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../../../shared/http/errorHandler';
import { FakeSessionRepository, FakeUserRepository, buildUser } from '../../../../../tests/fakes/authFakes';
import { testConfig } from '../../../../../tests/fakes/testConfig';

function buildApp(jwtService: JwtService, sessionRepository: FakeSessionRepository, userRepository: FakeUserRepository) {
  const app = express();
  app.use(correlationIdMiddleware);
  app.get('/protected', createAuthenticateMiddleware(jwtService, sessionRepository, userRepository), (req, res) => {
    res.status(200).json({ userId: req.auth?.userId });
  });
  app.use(errorHandlerMiddleware);
  return app;
}

describe('createAuthenticateMiddleware', () => {
  const config = testConfig();
  const jwtService = new JwtService(config);

  it('passes through with user context attached for a valid token/session', async () => {
    const userRepository = new FakeUserRepository();
    const sessionRepository = new FakeSessionRepository();
    const user = buildUser();
    userRepository.seed(user, [{ roleCode: 'CASHIER', roleName: 'Cashier', permissionKeys: ['billing.payment'] }]);
    const session = await sessionRepository.create({ userId: user.id, refreshTokenHash: 'h', expiredAt: new Date(Date.now() + 60_000) });
    const token = jwtService.signAccessToken({ sub: user.id, username: user.username, role: 'CASHIER', sessionId: session.id, clinicId: null });

    const response = await request(buildApp(jwtService, sessionRepository, userRepository))
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(user.id);
  });

  it('rejects a missing token with 401', async () => {
    const userRepository = new FakeUserRepository();
    const sessionRepository = new FakeSessionRepository();

    const response = await request(buildApp(jwtService, sessionRepository, userRepository)).get('/protected');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('rejects an invalid token with 401', async () => {
    const userRepository = new FakeUserRepository();
    const sessionRepository = new FakeSessionRepository();

    const response = await request(buildApp(jwtService, sessionRepository, userRepository))
      .get('/protected')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(response.status).toBe(401);
  });

  it('rejects a revoked session with 401', async () => {
    const userRepository = new FakeUserRepository();
    const sessionRepository = new FakeSessionRepository();
    const user = buildUser();
    userRepository.seed(user);
    const session = await sessionRepository.create({ userId: user.id, refreshTokenHash: 'h', expiredAt: new Date(Date.now() + 60_000) });
    await sessionRepository.revoke(session.id);
    const token = jwtService.signAccessToken({ sub: user.id, username: user.username, role: 'CASHIER', sessionId: session.id, clinicId: null });

    const response = await request(buildApp(jwtService, sessionRepository, userRepository))
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
  });

  it('rejects an inactive user with 401', async () => {
    const userRepository = new FakeUserRepository();
    const sessionRepository = new FakeSessionRepository();
    const user = buildUser({ status: 'INACTIVE' });
    userRepository.seed(user);
    const session = await sessionRepository.create({ userId: user.id, refreshTokenHash: 'h', expiredAt: new Date(Date.now() + 60_000) });
    const token = jwtService.signAccessToken({ sub: user.id, username: user.username, role: 'CASHIER', sessionId: session.id, clinicId: null });

    const response = await request(buildApp(jwtService, sessionRepository, userRepository))
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
  });

  it('rejects an expired token with 401', async () => {
    const userRepository = new FakeUserRepository();
    const sessionRepository = new FakeSessionRepository();
    const user = buildUser();
    userRepository.seed(user);
    const session = await sessionRepository.create({ userId: user.id, refreshTokenHash: 'h', expiredAt: new Date(Date.now() + 60_000) });
    const shortLivedJwt = new JwtService(testConfig({ JWT_ACCESS_EXPIRY: '1s' }));
    const token = shortLivedJwt.signAccessToken({ sub: user.id, username: user.username, role: 'CASHIER', sessionId: session.id, clinicId: null });

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const response = await request(buildApp(shortLivedJwt, sessionRepository, userRepository))
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
  });
});
