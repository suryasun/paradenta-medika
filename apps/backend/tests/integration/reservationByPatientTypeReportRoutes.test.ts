import express, { Router } from 'express';
import request from 'supertest';
import { correlationIdMiddleware } from '../../src/shared/logging/correlationId';
import { errorHandlerMiddleware } from '../../src/shared/http/errorHandler';
import { validateQuery } from '../../src/shared/http/validateQuery';
import { ReservationByPatientTypeReportQueryDto } from '../../src/modules/reports/application/dtos/ReservationByPatientTypeReportQueryDto';
import { GetReservationByPatientTypeReportUseCase } from '../../src/modules/reports/application/use-cases/GetReservationByPatientTypeReportUseCase';
import { ReservationByPatientTypeReportController } from '../../src/modules/reports/presentation/controllers/ReservationByPatientTypeReportController';
import { requirePermission } from '../../src/modules/auth/presentation/middlewares/authorize';
import { AuthenticatedContext } from '../../src/modules/auth/presentation/middlewares/authenticate';
import { FakeAuditService } from '../fakes/authFakes';
import { FakeReservationRepository } from '../fakes/reservationFakes';
import { parseTimeToDate } from '../../src/modules/reservation/application/services/timeUtils';

function buildApp(auth: AuthenticatedContext | undefined) {
  const reservationRepository = new FakeReservationRepository();
  const auditService = new FakeAuditService();
  const controller = new ReservationByPatientTypeReportController(new GetReservationByPatientTypeReportUseCase(reservationRepository));

  const router = Router();
  router.use((req, _res, next) => {
    req.auth = auth;
    next();
  });
  router.get(
    '/reports/reservations/by-patient-type',
    requirePermission('report.reservation.patient-type.read', auditService),
    validateQuery(ReservationByPatientTypeReportQueryDto),
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
  permissionKeys: ['report.reservation.patient-type.read'],
};

// docs/06-tasks/task-300.md
describe('GET /reports/reservations/by-patient-type', () => {
  it('returns paginated data plus a NEW/OLD summary breakdown, matching a manually counted seed dataset', async () => {
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
      reservationDate: new Date('2026-03-12T00:00:00.000Z'),
      reservationTime: parseTimeToDate('10:00'),
      reservationType: 'CONSULTATION',
      source: 'WHATSAPP',
      patientTypeAtBooking: 'OLD',
      createdBy: 'staff-1',
    });

    const response = await request(app)
      .get('/api/v1/reports/reservations/by-patient-type')
      .query({ dateFrom: '2026-03-01', dateTo: '2026-03-31' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.meta).toMatchObject({ page: 1, limit: 20, total: 2 });
    expect(response.body.meta.summary).toMatchObject({ newCount: 1, oldCount: 1, newPercentage: 50, oldPercentage: 50 });
  });

  it('rejects a requester without report.reservation.patient-type.read', async () => {
    const { app } = buildApp({ ...staffAuth, permissionKeys: [] });
    const response = await request(app)
      .get('/api/v1/reports/reservations/by-patient-type')
      .query({ dateFrom: '2026-03-01', dateTo: '2026-03-31' });
    expect(response.status).toBe(403);
  });
});
