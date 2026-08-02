import express from 'express';
import request from 'supertest';
import { requirePermission } from './authorize';
import { correlationIdMiddleware } from '../../../../shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../../../shared/http/errorHandler';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';
import { AuthenticatedContext } from './authenticate';

function buildApp(auditService: FakeAuditService, auth?: AuthenticatedContext) {
  const app = express();
  app.use(correlationIdMiddleware);
  app.use((req, res, next) => {
    req.auth = auth;
    next();
  });
  app.get('/patients', requirePermission('patient.create', auditService), (req, res) => {
    res.status(200).json({ ok: true });
  });
  app.use(errorHandlerMiddleware);
  return app;
}

describe('requirePermission', () => {
  it('allows a user who has the required permission to proceed', async () => {
    const auditService = new FakeAuditService();
    const auth: AuthenticatedContext = { userId: 'u1', username: 'jdoe', sessionId: 's1', roleCodes: ['REGISTRATION'], permissionKeys: ['patient.create'] };

    const response = await request(buildApp(auditService, auth)).get('/patients');

    expect(response.status).toBe(200);
  });

  it('rejects a user without the required permission with 403 and records an audit event', async () => {
    const auditService = new FakeAuditService();
    const auth: AuthenticatedContext = { userId: 'u1', username: 'jdoe', sessionId: 's1', roleCodes: ['CASHIER'], permissionKeys: ['billing.payment'] };

    const response = await request(buildApp(auditService, auth)).get('/patients');

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(auditService.records).toHaveLength(1);
  });

  it('rejects an unauthenticated request with 401', async () => {
    const auditService = new FakeAuditService();

    const response = await request(buildApp(auditService, undefined)).get('/patients');

    expect(response.status).toBe(401);
  });
});
