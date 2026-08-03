import { RequestHandler, Router } from 'express';
import { IEventBus } from '../../../../shared/events/EventBus';
import { IAuditService } from '../../../system/domain/services/IAuditService';
import { validateQuery } from '../../../../shared/http/validateQuery';
import { validateBody } from '../../../../shared/http/validateBody';
import { DashboardQueryDto } from '../../application/dtos/DashboardQueryDto';
import { ReportCatalogQueryDto } from '../../application/dtos/ReportCatalogQueryDto';
import { GetExecutiveDashboardUseCase } from '../../application/use-cases/GetExecutiveDashboardUseCase';
import { GetOperationsDashboardUseCase } from '../../application/use-cases/GetOperationsDashboardUseCase';
import { GetClinicalDashboardUseCase } from '../../application/use-cases/GetClinicalDashboardUseCase';
import { GetFinanceDashboardUseCase } from '../../application/use-cases/GetFinanceDashboardUseCase';
import { GetWarehouseDashboardUseCase } from '../../application/use-cases/GetWarehouseDashboardUseCase';
import { ListReportDefinitionsUseCase } from '../../application/use-cases/ListReportDefinitionsUseCase';
import { GetReportUseCase } from '../../application/use-cases/GetReportUseCase';
import { CreateReportJobUseCase } from '../../application/use-cases/CreateReportJobUseCase';
import { GetReportJobUseCase } from '../../application/use-cases/GetReportJobUseCase';
import { CancelReportJobUseCase } from '../../application/use-cases/CancelReportJobUseCase';
import { GetReportSnapshotUseCase } from '../../application/use-cases/GetReportSnapshotUseCase';
import { DownloadReportExportUseCase } from '../../application/use-cases/DownloadReportExportUseCase';
import { CreateReportJobRequestDto } from '../../application/dtos/CreateReportJobRequestDto';
import { DashboardController } from '../controllers/DashboardController';
import { ReportCatalogController } from '../controllers/ReportCatalogController';
import { ReportJobController } from '../controllers/ReportJobController';
import { ReportJobRepository } from '../../infrastructure/repositories/ReportJobRepository';
import { ReportSnapshotRepository } from '../../infrastructure/repositories/ReportSnapshotRepository';
import { ExportArtifactRepository } from '../../infrastructure/repositories/ExportArtifactRepository';
import { DashboardMetricAssembler } from '../../application/services/DashboardMetricAssembler';
import { registerDashboardProjections } from '../../application/projections/registerDashboardProjections';
import { DashboardSummaryRepository } from '../../infrastructure/repositories/DashboardSummaryRepository';
import { ProjectionCheckpointRepository } from '../../infrastructure/repositories/ProjectionCheckpointRepository';
import { BranchRepository } from '../../../master-data/infrastructure/repositories/BranchRepository';
import { InvoiceRepository } from '../../../billing/infrastructure/repositories/InvoiceRepository';
import { JournalRepository } from '../../../finance/infrastructure/repositories/JournalRepository';
import { AccountRepository } from '../../../finance/infrastructure/repositories/AccountRepository';
import { FinancialPeriodRepository } from '../../../finance/infrastructure/repositories/FinancialPeriodRepository';
import { FinanceReportRepository } from '../../../finance/infrastructure/repositories/FinanceReportRepository';
import { ReportDateRangeResolver } from '../../../finance/application/services/ReportDateRangeResolver';
import { GetTrialBalanceReportUseCase } from '../../../finance/application/use-cases/GetTrialBalanceReportUseCase';
import { GetIncomeStatementReportUseCase } from '../../../finance/application/use-cases/GetIncomeStatementReportUseCase';
import { QueueRepository } from '../../../queue/infrastructure/repositories/QueueRepository';
import { QueueDashboardUseCase } from '../../../queue/application/use-cases/QueueDashboardUseCase';
import { StockRepository } from '../../../warehouse/infrastructure/repositories/StockRepository';
import { ItemRepository } from '../../../warehouse/infrastructure/repositories/ItemRepository';
import { WarehouseLocationRepository } from '../../../warehouse/infrastructure/repositories/WarehouseLocationRepository';
import { WarehouseReportRepository } from '../../../warehouse/infrastructure/repositories/WarehouseReportRepository';
import { BatchRepository } from '../../../warehouse/infrastructure/repositories/BatchRepository';
import { GetStockCardReportUseCase } from '../../../warehouse/application/use-cases/GetStockCardReportUseCase';
import { GetExpiryReportUseCase } from '../../../warehouse/application/use-cases/GetExpiryReportUseCase';

/**
 * docs/06-tasks/task-178.md..task-191.md (Epic AG + Epic AH) composition
 * root. Registers the projection event consumers (task-178) and the five
 * dashboard endpoints backed by them (task-179-183), the report catalog/
 * on-demand endpoints (task-185-186), and the report-job/snapshot/export
 * endpoints (task-187-191, executed synchronously in-process -- see
 * CreateReportJobUseCase's doc comment). task-184 (HR Dashboard) is
 * deferred: no HR module or HR domain events exist anywhere in this
 * codebase yet, the same "genuinely blocked, skip and defer" resolution
 * already applied to task-136/task-162.
 */
export function buildReportsModule(
  auditService: IAuditService,
  eventBus: IEventBus,
  authenticate: RequestHandler,
  requirePermission: (code: string) => RequestHandler,
): Router {
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

  // docs/06-tasks/task-185.md/task-186.md (Epic AH). GetReportUseCase
  // dispatches to the already-built report/aggregation use cases per
  // report code, rather than re-implementing the same report logic.
  const financialPeriodRepository = new FinancialPeriodRepository();
  const financeReportDateRangeResolver = new ReportDateRangeResolver(financialPeriodRepository);
  const getReportUseCase = new GetReportUseCase(
    new QueueDashboardUseCase(new QueueRepository()),
    assembler,
    new GetTrialBalanceReportUseCase(new FinanceReportRepository(), financeReportDateRangeResolver),
    new GetIncomeStatementReportUseCase(new FinanceReportRepository(), financeReportDateRangeResolver),
    new GetStockCardReportUseCase(new WarehouseReportRepository()),
    new GetExpiryReportUseCase(new BatchRepository()),
  );
  const reportCatalogController = new ReportCatalogController(new ListReportDefinitionsUseCase(), getReportUseCase);

  // docs/06-tasks/task-187.md..task-191.md (Epic AH).
  const reportJobRepository = new ReportJobRepository();
  const reportSnapshotRepository = new ReportSnapshotRepository();
  const exportArtifactRepository = new ExportArtifactRepository();
  const reportJobController = new ReportJobController(
    new CreateReportJobUseCase(reportJobRepository, reportSnapshotRepository, exportArtifactRepository, getReportUseCase),
    new GetReportJobUseCase(reportJobRepository),
    new CancelReportJobUseCase(reportJobRepository),
    new GetReportSnapshotUseCase(reportSnapshotRepository),
    new DownloadReportExportUseCase(exportArtifactRepository, auditService),
  );

  const router = Router();
  router.use(authenticate);

  router.get('/reports/definitions', requirePermission('report.catalog.read'), reportCatalogController.definitions);

  // docs/03-sad/20-module-report.md Section 8.1: literal `report.job.*`/
  // `report.export.*` verbs -- no dedicated "read" permission exists for
  // job-status/snapshot GETs in the catalog, so they reuse `report.job.
  // create` (the same "the permission that lets you start it lets you
  // check on it" convention used elsewhere in this codebase, e.g. PO/
  // Expense Update reusing their own Create permission).
  router.post(
    '/reports/:reportCode/jobs',
    requirePermission('report.job.create'),
    validateBody(CreateReportJobRequestDto),
    reportJobController.create,
  );
  router.get('/reports/jobs/:jobId', requirePermission('report.job.create'), reportJobController.detail);
  router.post('/reports/jobs/:jobId/cancel', requirePermission('report.job.cancel'), reportJobController.cancel);
  router.get('/reports/snapshots/:snapshotId', requirePermission('report.job.create'), reportJobController.snapshot);
  router.get('/reports/exports/:artifactId/download', requirePermission('report.export.download'), reportJobController.download);

  router.get(
    '/reports/:reportCode',
    requirePermission('report.catalog.read'),
    validateQuery(ReportCatalogQueryDto),
    reportCatalogController.getReport,
  );

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
