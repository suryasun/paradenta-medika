import express, { Router } from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { validateQuery } from '../../src/shared/http/validateQuery';
import { ReservationByStatusReportQueryDto } from '../../src/modules/reports/application/dtos/ReservationByStatusReportQueryDto';
import { GetReservationByStatusReportUseCase } from '../../src/modules/reports/application/use-cases/GetReservationByStatusReportUseCase';
import { ReservationByStatusReportController } from '../../src/modules/reports/presentation/controllers/ReservationByStatusReportController';
import { requirePermission } from '../../src/modules/auth/presentation/middlewares/authorize';
import { AuthenticatedContext } from '../../src/modules/auth/presentation/middlewares/authenticate';
import { FakeAuditService } from '../fakes/authFakes';
import { FakeReservationRepository } from '../fakes/reservationFakes';
import { parseTimeToDate } from '../../src/modules/reservation/application/services/timeUtils';

function buildApp(auth: AuthenticatedContext | undefined) {
  const reservationRepository = new FakeReservationRepository();
  const auditService = new FakeAuditService();
  const controller = new ReservationByStatusReportController(new GetReservationByStatusReportUseCase(reservationRepository));

  const router = Router();
  router.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  router.get(
    '/reports/reservations/by-status',
    requirePermission('report.reservation.by-status.read', auditService),
    validateQuery(ReservationByStatusReportQueryDto),
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
  permissionKeys: ['report.reservation.by-status.read'],
};

// docs/06-tasks/task-305.md Testing Required (renamed from task-299.md)
describe('GET /reports/reservations/by-status', () => {
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

    const response = await request(app).get('/api/v1/reports/reservations/by-status').query({ dateFrom: '2026-03-01', dateTo: '2026-03-31' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].reservationNumber).toBe('RSV-1');
    expect(response.body.meta).toMatchObject({ page: 1, limit: 20, total: 1 });
    expect(response.body.meta.summary).toMatchObject({ total: 1, trend: [{ date: '2026-03-10', count: 1 }] });
  });

  it('narrows to an explicitly selected status', async () => {
    const { app, reservationRepository } = buildApp(staffAuth);

    const r1 = await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: new Date('2026-03-15T00:00:00.000Z'),
      reservationTime: parseTimeToDate('10:00'),
      reservationType: 'CONSULTATION',
      source: 'WHATSAPP',
      createdBy: 'staff-1',
    });
    reservationRepository.reservations.get(r1.id)!.status = 'CANCELLED';

    const response = await request(app)
      .get('/api/v1/reports/reservations/by-status')
      .query({ dateFrom: '2026-03-01', dateTo: '2026-03-31', status: 'CANCELLED' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.summary.total).toBe(1);
  });

  it('rejects a request missing dateFrom/dateTo', async () => {
    const { app } = buildApp(staffAuth);
    const response = await request(app).get('/api/v1/reports/reservations/by-status');
    expect(response.status).toBe(400);
  });

  it('rejects a requester without report.reservation.by-status.read', async () => {
    const { app } = buildApp({ ...staffAuth, permissionKeys: [] });
    const response = await request(app).get('/api/v1/reports/reservations/by-status').query({ dateFrom: '2026-03-01', dateTo: '2026-03-31' });
    expect(response.status).toBe(403);
  });
});
