import { RequestHandler, Router } from 'express';
import { IEventBus } from '../../../../shared/events/EventBus';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { DashboardQueryDto } from '../../application/dtos/DashboardQueryDto';
import { GetExecutiveDashboardUseCase } from '../../application/use-cases/GetExecutiveDashboardUseCase';
import { GetOperationsDashboardUseCase } from '../../application/use-cases/GetOperationsDashboardUseCase';
import { GetClinicalDashboardUseCase } from '../../application/use-cases/GetClinicalDashboardUseCase';
import { GetFinanceDashboardUseCase } from '../../application/use-cases/GetFinanceDashboardUseCase';
import { GetWarehouseDashboardUseCase } from '../../application/use-cases/GetWarehouseDashboardUseCase';
import { DashboardController } from '../controllers/DashboardController';
import { DashboardMetricAssembler } from '../../application/services/DashboardMetricAssembler';
import { registerDashboardProjections } from '../../application/projections/registerDashboardProjections';
import { DashboardSummaryRepository } from '../../infrastructure/repositories/DashboardSummaryRepository';
import { ProjectionCheckpointRepository } from '../../infrastructure/repositories/ProjectionCheckpointRepository';
import { BranchRepository } from '../../../master-data/infrastructure/repositories/BranchRepository';
import { InvoiceRepository } from '../../../billing/infrastructure/repositories/InvoiceRepository';
import { JournalRepository } from '../../../finance/infrastructure/repositories/JournalRepository';
import { AccountRepository } from '../../../finance/infrastructure/repositories/AccountRepository';
import { QueueRepository } from '../../../queue/infrastructure/repositories/QueueRepository';
import { StockRepository } from '../../../warehouse/infrastructure/repositories/StockRepository';
import { ItemRepository } from '../../../warehouse/infrastructure/repositories/ItemRepository';
import { WarehouseLocationRepository } from '../../../warehouse/infrastructure/repositories/WarehouseLocationRepository';

/**
 * docs/06-tasks/task-178.md..task-184.md (Epic AG) composition root.
 * Registers the projection event consumers (task-178) and the five
 * dashboard endpoints backed by them (task-179-183). task-184 (HR
 * Dashboard) is deferred: no HR module or HR domain events exist
 * anywhere in this codebase yet, the same "genuinely blocked, skip and
 * defer" resolution already applied to task-136/task-162.
 */
export function buildReportsModule(eventBus: IEventBus, authenticate: RequestHandler, requirePermission: (code: string) => RequestHandler): Router {
  const dashboardSummaryRepository = new DashboardSummaryRepository();
  const checkpointRepository = new ProjectionCheckpointRepository();
  const branchRepository = new BranchRepository();

  registerDashboardProjections({
    eventBus,
    dashboardSummaryRepository,
    checkpointRepository,
    invoiceRepository: new InvoiceRepository(),
    journalRepository: new JournalRepository(),
    accountRepository: new AccountRepository(),
    queueRepository: new QueueRepository(),
    stockRepository: new StockRepository(),
    itemRepository: new ItemRepository(),
    warehouseLocationRepository: new WarehouseLocationRepository(),
  });

  const assembler = new DashboardMetricAssembler(dashboardSummaryRepository, branchRepository);
  const dashboardController = new DashboardController(
    new GetExecutiveDashboardUseCase(assembler),
    new GetOperationsDashboardUseCase(assembler),
    new GetClinicalDashboardUseCase(assembler),
    new GetFinanceDashboardUseCase(assembler),
    new GetWarehouseDashboardUseCase(assembler),
  );

  const router = Router();
  router.use(authenticate);

  router.get(
    '/reports/dashboards/executive',
    requirePermission('report.dashboard.executive.read'),
    validateQuery(DashboardQueryDto),
    dashboardController.executive,
  );
  router.get(
    '/reports/dashboards/operations',
    requirePermission('report.dashboard.operations.read'),
    validateQuery(DashboardQueryDto),
    dashboardController.operations,
  );
  router.get(
    '/reports/dashboards/clinical',
    requirePermission('report.dashboard.clinical.read'),
    validateQuery(DashboardQueryDto),
    dashboardController.clinical,
  );
  router.get(
    '/reports/dashboards/finance',
    requirePermission('report.dashboard.finance.read'),
    validateQuery(DashboardQueryDto),
    dashboardController.finance,
  );
  router.get(
    '/reports/dashboards/warehouse',
    requirePermission('report.dashboard.warehouse.read'),
    validateQuery(DashboardQueryDto),
    dashboardController.warehouse,
  );

  return router;
}
