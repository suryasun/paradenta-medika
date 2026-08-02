import { RequestHandler, Router } from 'express';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { OperationsDashboardQueryDto } from '../../application/dtos/OperationsDashboardQueryDto';
import { OperationsDashboardUseCase } from '../../application/use-cases/OperationsDashboardUseCase';
import { OperationsDashboardController } from '../controllers/OperationsDashboardController';
import { ReservationRepository } from '../../../reservation/infrastructure/repositories/ReservationRepository';
import { QueueRepository } from '../../../queue/infrastructure/repositories/QueueRepository';
import { PaymentRepository } from '../../../billing/infrastructure/repositories/PaymentRepository';
import { BranchRepository } from '../../../master-data/infrastructure/repositories/BranchRepository';

/**
 * docs/06-tasks/task-059.md composition root. Only
 * GET /reports/dashboards/operations is exposed (task-059's Acceptance
 * Criteria: "No other dashboard/report endpoint from the full Reporting
 * module ... is exposed in this task") -- the other five dashboards and the
 * report job/export/snapshot infrastructure (Section 6.2-6.4) are Phase 3
 * scope (task-095 onward), not built here.
 */
export function buildReportsModule(authenticate: RequestHandler, requirePermission: (code: string) => RequestHandler): Router {
  const operationsDashboardUseCase = new OperationsDashboardUseCase(
    new ReservationRepository(),
    new QueueRepository(),
    new PaymentRepository(),
    new BranchRepository(),
  );
  const controller = new OperationsDashboardController(operationsDashboardUseCase);

  const router = Router();
  router.use(authenticate);

  router.get(
    '/reports/dashboards/operations',
    requirePermission('report.dashboard.operations.read'),
    validateQuery(OperationsDashboardQueryDto),
    controller.dashboard,
  );

  return router;
}
