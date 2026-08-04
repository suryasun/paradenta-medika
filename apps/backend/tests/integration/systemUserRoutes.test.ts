import express, { Router } from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { validateBody } from '../../src/shared/http/validateBody';
import { validateQuery } from '../../src/shared/http/validateQuery';
import { ListQueryDto } from '../../src/shared/http/ListQueryDto';
import { CreateUserRequestDto } from '../../src/modules/system/application/dtos/CreateUserRequestDto';
import { CreateUserUseCase } from '../../src/modules/system/application/use-cases/CreateUserUseCase';
import { ListUsersUseCase } from '../../src/modules/system/application/use-cases/ListUsersUseCase';
import { GetUserUseCase } from '../../src/modules/system/application/use-cases/GetUserUseCase';
import { UpdateUserUseCase } from '../../src/modules/system/application/use-cases/UpdateUserUseCase';
import { ActivateUserUseCase } from '../../src/modules/system/application/use-cases/ActivateUserUseCase';
import { DeactivateUserUseCase } from '../../src/modules/system/application/use-cases/DeactivateUserUseCase';
import { AssignRoleToUserUseCase } from '../../src/modules/system/application/use-cases/AssignRoleToUserUseCase';
import { RevokeUserSessionsUseCase } from '../../src/modules/system/application/use-cases/RevokeUserSessionsUseCase';
import { UserAdminController } from '../../src/modules/system/presentation/controllers/UserAdminController';
import { requirePermission } from '../../src/modules/auth/presentation/middlewares/authorize';
import { AuthenticatedContext } from '../../src/modules/auth/presentation/middlewares/authenticate';
import { PasswordService } from '../../src/modules/auth/application/services/PasswordService';
import { FakeUserAdminRepository, FakeRoleRepository, FakeUserRoleRepository } from '../fakes/systemFakes';
import { FakeAuditService, FakeSessionRepository } from '../fakes/authFakes';
import { testConfig } from '../fakes/testConfig';

function buildApp(auth?: AuthenticatedContext) {
  const userAdminRepository = new FakeUserAdminRepository();
  const roleRepository = new FakeRoleRepository();
  const userRoleRepository = new FakeUserRoleRepository(roleRepository);
  const sessionRepository = new FakeSessionRepository();
  const auditService = new FakeAuditService();
  const passwordService = new PasswordService(testConfig());

  const controller = new UserAdminController(
    new CreateUserUseCase(userAdminRepository, roleRepository, userRoleRepository, passwordService, auditService),
    new ListUsersUseCase(userAdminRepository),
    new GetUserUseCase(userAdminRepository, userRoleRepository),
    new UpdateUserUseCase(userAdminRepository, auditService),
    new ActivateUserUseCase(userAdminRepository, auditService),
    new DeactivateUserUseCase(userAdminRepository, sessionRepository, auditService),
    new AssignRoleToUserUseCase(userAdminRepository, roleRepository, userRoleRepository, auditService),
    new RevokeUserSessionsUseCase(userAdminRepository, sessionRepository, auditService),
  );

  const router = Router();
  router.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  router.get(
    '/system/users',
    requirePermission('system.user.read', auditService),
    validateQuery(ListQueryDto),
    controller.list,
  );
  router.post(
    '/system/users',
    requirePermission('system.user.manage', auditService),
    validateBody(CreateUserRequestDto),
    controller.create,
  );

  const app = express();
  app.use(correlationIdMiddleware);
  app.use(express.json());
  app.use('/api/v1', router);
  app.use(errorHandlerMiddleware);

  return { app, userAdminRepository };
}

describe('GET/POST /api/v1/system/users', () => {
  const authorizedAuth: AuthenticatedContext = {
    userId: 'admin-1',
    username: 'admin',
    sessionId: 'session-1',
    roleCodes: ['ADMINISTRATOR'],
    permissionKeys: ['system.user.read', 'system.user.manage'],
  };

  it('a user without system.user.manage cannot create a user (403)', async () => {
    const { app } = buildApp({ ...authorizedAuth, permissionKeys: ['system.user.read'] });

    const response = await request(app)
      .post('/api/v1/system/users')
      .send({ username: 'newuser', email: 'newuser@example.com', password: 'Str0ng!Passw0rd' });

    expect(response.status).toBe(403);
  });

  it('creates a user visible in the subsequent list', async () => {
    const { app } = buildApp(authorizedAuth);

    const createResponse = await request(app)
      .post('/api/v1/system/users')
      .send({ username: 'newuser', email: 'newuser@example.com', password: 'Str0ng!Passw0rd' });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.passwordHash).toBeUndefined();

    const listResponse = await request(app).get('/api/v1/system/users');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.meta).toMatchObject({ page: 1, limit: 20, total: 1 });
  });

  it('returns 401 when no authenticated context is present', async () => {
    const { app } = buildApp(undefined);

    const response = await request(app).get('/api/v1/system/users');

    expect(response.status).toBe(401);
  });
});
