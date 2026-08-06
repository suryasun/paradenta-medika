import express, { Router } from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { validateQuery } from '../../src/shared/http/validateQuery';
import { CompletedReservationReportQueryDto } from '../../src/modules/reports/application/dtos/CompletedReservationReportQueryDto';
import { GetCompletedReservationReportUseCase } from '../../src/modules/reports/application/use-cases/GetCompletedReservationReportUseCase';
import { CompletedReservationReportController } from '../../src/modules/reports/presentation/controllers/CompletedReservationReportController';
import { requirePermission } from '../../src/modules/auth/presentation/middlewares/authorize';
import { AuthenticatedContext } from '../../src/modules/auth/presentation/middlewares/authenticate';
import { FakeAuditService } from '../fakes/authFakes';
import { FakeReservationRepository } from '../fakes/reservationFakes';
import { parseTimeToDate } from '../../src/modules/reservation/application/services/timeUtils';

function buildApp(auth: AuthenticatedContext | undefined) {
  const reservationRepository = new FakeReservationRepository();
  const auditService = new FakeAuditService();
  const controller = new CompletedReservationReportController(new GetCompletedReservationReportUseCase(reservationRepository));

  const router = Router();
  router.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  router.get(
    '/reports/reservations/completed',
    requirePermission('report.reservation.completed.read', auditService),
    validateQuery(CompletedReservationReportQueryDto),
    controller.report,
  );

  const app = express();
  app.use(correlationIdMiddleware);
  app.use(express.json());
  app.use('/api/v1', router);
  app.use(errorHandlerMiddleware);

  return { app, reservationRepository };
}

const staffAuth: AuthenticatedContext = {
  userId: 'staff-1',
  username: 'registration',
  sessionId: 'session-1',
  roleCodes: ['REGISTRATION'],
  permissionKeys: ['report.reservation.completed.read'],
};

// docs/06-tasks/task-299.md Testing Required
describe('GET /reports/reservations/completed', () => {
  it('returns paginated data plus a summary trend, matching a manually counted seed dataset', async () => {
    const { app, reservationRepository } = buildApp(staffAuth);

    const r1 = await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: new Date('2026-03-10T00:00:00.000Z'),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      createdBy: 'staff-1',
    });
    reservationRepository.reservations.get(r1.id)!.status = 'COMPLETED';

    const r2 = await reservationRepository.create({
      reservationNo: 'RSV-2',
      patientId: 'p2',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: new Date('2026-03-15T00:00:00.000Z'),
      reservationTime: parseTimeToDate('10:00'),
      reservationType: 'CONSULTATION',
      source: 'WHATSAPP',
      createdBy: 'staff-1',
    });
    reservationRepository.reservations.get(r2.id)!.status = 'CANCELLED';

    const response = await request(app).get('/api/v1/reports/reservations/completed').query({ dateFrom: '2026-03-01', dateTo: '2026-03-31' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].reservationNumber).toBe('RSV-1');
    expect(response.body.meta).toMatchObject({ page: 1, limit: 20, total: 1 });
    expect(response.body.meta.summary).toMatchObject({ totalCompleted: 1, trend: [{ date: '2026-03-10', count: 1 }] });
  });

  it('rejects a request missing dateFrom/dateTo', async () => {
    const { app } = buildApp(staffAuth);
    const response = await request(app).get('/api/v1/reports/reservations/completed');
    expect(response.status).toBe(400);
  });

  it('rejects a requester without report.reservation.completed.read', async () => {
    const { app } = buildApp({ ...staffAuth, permissionKeys: [] });
    const response = await request(app).get('/api/v1/reports/reservations/completed').query({ dateFrom: '2026-03-01', dateTo: '2026-03-31' });
    expect(response.status).toBe(403);
  });
});
