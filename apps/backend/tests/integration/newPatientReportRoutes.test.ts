import express, { Router } from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { validateQuery } from '../../src/shared/http/validateQuery';
import { NewPatientReportQueryDto } from '../../src/modules/reports/application/dtos/NewPatientReportQueryDto';
import { GetNewPatientReportUseCase } from '../../src/modules/reports/application/use-cases/GetNewPatientReportUseCase';
import { NewPatientReportController } from '../../src/modules/reports/presentation/controllers/NewPatientReportController';
import { requirePermission } from '../../src/modules/auth/presentation/middlewares/authorize';
import { AuthenticatedContext } from '../../src/modules/auth/presentation/middlewares/authenticate';
import { FakeAuditService } from '../fakes/authFakes';
import { FakeReservationRepository } from '../fakes/reservationFakes';
import { parseTimeToDate } from '../../src/modules/reservation/application/services/timeUtils';

function buildApp(auth: AuthenticatedContext | undefined) {
  const reservationRepository = new FakeReservationRepository();
  const auditService = new FakeAuditService();
  const controller = new NewPatientReportController(new GetNewPatientReportUseCase(reservationRepository));

  const router = Router();
  router.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  router.get(
    '/reports/reservations/new-patients',
    requirePermission('report.reservation.new-patient.read', auditService),
    validateQuery(NewPatientReportQueryDto),
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
  permissionKeys: ['report.reservation.new-patient.read'],
};

// docs/06-tasks/task-291.md Testing Required: "GET
// /reports/reservations/new-patients?dateFrom=...&dateTo=... returns the
// documented response shape (paginated data + summary), verified against a
// manually counted seed dataset."
describe('GET /reports/reservations/new-patients', () => {
  it('returns paginated data plus a summary object, matching a manually counted seed dataset', async () => {
    const { app, reservationRepository } = buildApp(staffAuth);

    await reservationRepository.create({
      reservationNo: 'RSV-1',
      patientId: 'p1',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: new Date('2026-03-10T00:00:00.000Z'),
      reservationTime: parseTimeToDate('09:00'),
      reservationType: 'APPOINTMENT',
      source: 'PHONE',
      patientTypeAtBooking: 'NEW',
      createdBy: 'staff-1',
    });
    await reservationRepository.create({
      reservationNo: 'RSV-2',
      patientId: 'p2',
      doctorId: 'd1',
      branchId: 'b1',
      reservationDate: new Date('2026-03-15T00:00:00.000Z'),
      reservationTime: parseTimeToDate('10:00'),
      reservationType: 'CONSULTATION',
      source: 'WHATSAPP',
      patientTypeAtBooking: 'OLD',
      createdBy: 'staff-1',
    });

    const response = await request(app).get('/api/v1/reports/reservations/new-patients').query({ dateFrom: '2026-03-01', dateTo: '2026-03-31' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].reservationNumber).toBe('RSV-1');
    expect(response.body.meta).toMatchObject({ page: 1, limit: 20, total: 1 });
    expect(response.body.meta.summary).toMatchObject({ totalNewPatients: 1, topProcedure: 'APPOINTMENT' });
  });

  it('rejects a request missing dateFrom/dateTo', async () => {
    const { app } = buildApp(staffAuth);
    const response = await request(app).get('/api/v1/reports/reservations/new-patients');
    expect(response.status).toBe(400);
  });

  it('rejects a requester without report.reservation.new-patient.read', async () => {
    const { app } = buildApp({ ...staffAuth, permissionKeys: [] });
    const response = await request(app).get('/api/v1/reports/reservations/new-patients').query({ dateFrom: '2026-03-01', dateTo: '2026-03-31' });
    expect(response.status).toBe(403);
  });
});
