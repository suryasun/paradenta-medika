import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ConfigService } from './shared/config/ConfigService';
import { correlationIdMiddleware } from './shared/logging/correlationId';
import { requestLoggerMiddleware } from './shared/logging/requestLogger';
import { permissionsPolicyMiddleware } from './shared/http/securityHeaders';
import { buildHealthRouter } from './shared/http/healthRoutes';
import { errorHandlerMiddleware, notFoundMiddleware } from './shared/http/errorHandler';
import { AuditService } from './modules/system/infrastructure/services/AuditService';
import { buildAuthModule } from './modules/auth/presentation/routes/auth.routes';
import { buildSystemModule } from './modules/system/presentation/routes/system.routes';
import { buildMasterDataModule } from './modules/master-data/presentation/routes/master-data.routes';
import { buildPatientModule } from './modules/patient/presentation/routes/patient.routes';
import { buildReservationModule } from './modules/reservation/presentation/routes/reservation.routes';
import { buildQueueModule } from './modules/queue/presentation/routes/queue.routes';
import { buildEmrModule, buildAttachmentFileRouter } from './modules/emr/presentation/routes/emr.routes';
import { buildBillingModule } from './modules/billing/presentation/routes/billing.routes';
import { buildReportsModule } from './modules/reports/presentation/routes/reports.routes';
import { buildWarehouseModule } from './modules/warehouse/presentation/routes/warehouse.routes';
import { buildFinanceModule } from './modules/finance/presentation/routes/finance.routes';
import { eventBus } from './shared/events/EventBus';

const API_V1_PREFIX = '/api/v1';

/**
 * Express application bootstrap per docs/06-tasks/task-005.md and the
 * pipeline documented in docs/03-sad/02-system-architecture.md Section 15.3:
 * Logger -> JWT (per-route) -> Permission (per-route) -> Validation ->
 * Controller -> Service -> Repository -> Database -> JSON Response, wrapped
 * by CORS and a centralized Exception Handler.
 */
export function createApp(config: ConfigService): Express {
  const app = express();

  app.use(correlationIdMiddleware);
  app.use(requestLoggerMiddleware);
  app.use(express.json());
  app.use(
    cors({
      origin: config.get('frontendOrigin'),
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'X-Correlation-ID', 'Idempotency-Key'],
      credentials: false,
    }),
  );
  app.use(helmet());
  app.use(permissionsPolicyMiddleware);

  app.use(buildHealthRouter(config));

  // docs/06-tasks/task-080.md: signed-URL file serving. Must be mounted
  // before any router with an unconditional `router.use(authenticate)`
  // (system/master-data/emr/etc. below) -- those call next(err) on a
  // missing bearer token, which skips straight to the global error
  // handler rather than falling through to this sibling router, so
  // mounting it later would make it unreachable for unauthenticated
  // requests (verified live: returned 401 before this was moved here).
  app.use(API_V1_PREFIX, buildAttachmentFileRouter(config));

  const auditService = new AuditService();
  const authModule = buildAuthModule(config, auditService);
  app.use(API_V1_PREFIX, authModule.router);

  const systemRouter = buildSystemModule(
    config,
    auditService,
    eventBus,
    authModule.sessionRepository,
    authModule.authenticate,
    authModule.requirePermission,
  );
  app.use(API_V1_PREFIX, systemRouter);

  const masterDataRouter = buildMasterDataModule(
    auditService,
    authModule.userRepository,
    authModule.authenticate,
    authModule.requirePermission,
  );
  app.use(API_V1_PREFIX, masterDataRouter);

  const patientRouter = buildPatientModule(auditService, eventBus, authModule.authenticate, authModule.requirePermission);
  app.use(API_V1_PREFIX, patientRouter);

  const reservationRouter = buildReservationModule(auditService, eventBus, authModule.authenticate, authModule.requirePermission);
  app.use(API_V1_PREFIX, reservationRouter);

  const queueRouter = buildQueueModule(auditService, eventBus, authModule.authenticate, authModule.requirePermission);
  app.use(API_V1_PREFIX, queueRouter);

  const emrRouter = buildEmrModule(config, auditService, eventBus, authModule.authenticate, authModule.requirePermission);
  app.use(API_V1_PREFIX, emrRouter);

  const billingRouter = buildBillingModule(auditService, eventBus, authModule.authenticate, authModule.requirePermission);
  app.use(API_V1_PREFIX, billingRouter);

  // Phase 1 module composition is now complete (Epics J, A-I / task-001..059).
  // Phase 2 modules are mounted here as each is implemented, reusing
  // authModule.authenticate / authModule.requirePermission for protected routes.

  const warehouseRouter = buildWarehouseModule(auditService, eventBus, authModule.authenticate, authModule.requirePermission);
  app.use(API_V1_PREFIX, warehouseRouter);

  const financeRouter = buildFinanceModule(auditService, eventBus, authModule.authenticate, authModule.requirePermission);
  app.use(API_V1_PREFIX, financeRouter);

  // Phase 3 modules are mounted here as each is implemented (Warehouse Epic V onward; Finance Epic AB onward).

  // Epic AG (task-178-184): Reporting's dashboard projections subscribe to
  // events published by Patient/Reservation/Queue/EMR/Billing/Finance/
  // Warehouse, so this is wired last, after every source module's own
  // composition root has registered its repositories.
  const reportsRouter = buildReportsModule(auditService, eventBus, authModule.authenticate, authModule.requirePermission);
  app.use(API_V1_PREFIX, reportsRouter);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
