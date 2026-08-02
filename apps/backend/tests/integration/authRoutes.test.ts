import express from 'express';
import request from 'supertest';
import { Router } from 'express';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { validateBody } from '../../src/shared/http/validateBody';
import { LoginRequestDto } from '../../src/modules/auth/application/dtos/LoginRequestDto';
import { RefreshTokenRequestDto } from '../../src/modules/auth/application/dtos/RefreshTokenRequestDto';
import { ChangePasswordRequestDto } from '../../src/modules/auth/application/dtos/ChangePasswordRequestDto';
import { JwtService } from '../../src/modules/auth/application/services/JwtService';
import { PasswordService } from '../../src/modules/auth/application/services/PasswordService';
import { LoginUseCase } from '../../src/modules/auth/application/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '../../src/modules/auth/application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '../../src/modules/auth/application/use-cases/LogoutUseCase';
import { ChangePasswordUseCase } from '../../src/modules/auth/application/use-cases/ChangePasswordUseCase';
import { ForgotPasswordUseCase } from '../../src/modules/auth/application/use-cases/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../src/modules/auth/application/use-cases/ResetPasswordUseCase';
import { AuthController } from '../../src/modules/auth/presentation/controllers/AuthController';
import { createAuthenticateMiddleware } from '../../src/modules/auth/presentation/middlewares/authenticate';
import { FakeAuditService, FakePasswordResetTokenRepository, FakeSessionRepository, FakeUserRepository, buildUser } from '../fakes/authFakes';
import { testConfig } from '../fakes/testConfig';
import { IEmailSender } from '../../src/modules/auth/application/services/IEmailSender';

class NullEmailSender implements IEmailSender {
  async send(): Promise<void> {
    /* no-op for tests */
  }
}

function buildTestAuthApp() {
  const config = testConfig();
  const userRepository = new FakeUserRepository();
  const sessionRepository = new FakeSessionRepository();
  const passwordResetTokenRepository = new FakePasswordResetTokenRepository();
  const auditService = new FakeAuditService();
  const passwordService = new PasswordService(config);
  const jwtService = new JwtService(config);

  const controller = new AuthController(
    new LoginUseCase(userRepository, sessionRepository, passwordService, jwtService, auditService, config),
    new RefreshTokenUseCase(userRepository, sessionRepository, jwtService, auditService, config),
    new LogoutUseCase(sessionRepository, auditService),
    new ChangePasswordUseCase(userRepository, sessionRepository, passwordService, auditService),
    new ForgotPasswordUseCase(userRepository, passwordResetTokenRepository, new NullEmailSender()),
    new ResetPasswordUseCase(userRepository, passwordResetTokenRepository, sessionRepository, passwordService, auditService),
  );
  const authenticate = createAuthenticateMiddleware(jwtService, sessionRepository, userRepository);

  const router = Router();
  router.post('/auth/login', validateBody(LoginRequestDto), controller.login);
  router.post('/auth/refresh', validateBody(RefreshTokenRequestDto), controller.refresh);
  router.post('/auth/logout', authenticate, controller.logout);
  router.post('/auth/change-password', authenticate, validateBody(ChangePasswordRequestDto), controller.changePassword);

  const app = express();
  app.use(correlationIdMiddleware);
  app.use(express.json());
  app.use('/api/v1', router);
  app.use(errorHandlerMiddleware);

  return { app, userRepository, passwordService };
}

describe('POST /api/v1/auth/login', () => {
  it('returns tokens for a seeded user with valid credentials', async () => {
    const { app, userRepository, passwordService } = buildTestAuthApp();
    const passwordHash = await passwordService.hash('Str0ng!Passw0rd');
    userRepository.seed(buildUser({ username: 'jdoe', email: 'jdoe@example.com', passwordHash }));

    const response = await request(app).post('/api/v1/auth/login').send({ identifier: 'jdoe', password: 'Str0ng!Passw0rd' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toEqual(expect.any(String));
  });

  it('returns 401 with a generic message for wrong credentials', async () => {
    const { app, userRepository, passwordService } = buildTestAuthApp();
    const passwordHash = await passwordService.hash('Str0ng!Passw0rd');
    userRepository.seed(buildUser({ username: 'jdoe', passwordHash }));

    const response = await request(app).post('/api/v1/auth/login').send({ identifier: 'jdoe', password: 'wrong' });

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/invalid username\/email or password/i);
  });

  it('rejects a request with an unknown field (whitelist validation)', async () => {
    const { app } = buildTestAuthApp();

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'jdoe', password: 'x', extraField: 'not allowed' });

    expect(response.status).toBe(400);
  });
});

describe('POST /api/v1/auth/logout + refresh interaction', () => {
  it('rejects a refresh attempt using a refresh token whose session was logged out', async () => {
    const { app, userRepository, passwordService } = buildTestAuthApp();
    const passwordHash = await passwordService.hash('Str0ng!Passw0rd');
    userRepository.seed(buildUser({ username: 'jdoe', passwordHash }));

    const loginResponse = await request(app).post('/api/v1/auth/login').send({ identifier: 'jdoe', password: 'Str0ng!Passw0rd' });
    const { accessToken, refreshToken } = loginResponse.body.data;

    const logoutResponse = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${accessToken}`);
    expect(logoutResponse.status).toBe(200);

    const refreshResponse = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
    expect(refreshResponse.status).toBe(401);
  });
});
