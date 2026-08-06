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
import { PaymentRepository } from '../../../billing/infrastructure/repositories/PaymentRepository';
import { UserRoleRepository } from '../../../system/infrastructure/repositories/UserRoleRepository';
import { UserBranchRepository } from '../../../system/infrastructure/repositories/UserBranchRepository';
import { BranchAuthorizationService } from '../../application/services/BranchAuthorizationService';
import { BranchDashboardQueryDto } from '../../application/dtos/BranchDashboardQueryDto';
import { BranchComparisonQueryDto } from '../../application/dtos/BranchComparisonQueryDto';
import { BranchPerformanceQueryDto } from '../../application/dtos/BranchPerformanceQueryDto';
import { GetBranchDashboardUseCase } from '../../application/use-cases/GetBranchDashboardUseCase';
import { GetBranchComparisonReportUseCase } from '../../application/use-cases/GetBranchComparisonReportUseCase';
import { GetBranchPerformanceReportUseCase } from '../../application/use-cases/GetBranchPerformanceReportUseCase';
import { BranchReportsController } from '../controllers/BranchReportsController';
import { NewPatientReportQueryDto } from '../../application/dtos/NewPatientReportQueryDto';
import { GetNewPatientReportUseCase } from '../../application/use-cases/GetNewPatientReportUseCase';
import { NewPatientReportController } from '../controllers/NewPatientReportController';
import { CompletedReservationReportQueryDto } from '../../application/dtos/CompletedReservationReportQueryDto';
import { GetCompletedReservationReportUseCase } from '../../application/use-cases/GetCompletedReservationReportUseCase';
import { CompletedReservationReportController } from '../controllers/CompletedReservationReportController';
import { ReservationRepository } from '../../../reservation/infrastructure/repositories/ReservationRepository';

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

  // docs/06-tasks/task-218.md/task-219.md/task-220.md (Phase 4 Epics BD/BE/BF).
  const branchAuthorizationService = new BranchAuthorizationService(new UserRoleRepository(), new UserBranchRepository());
  const branchReportsController = new BranchReportsController(
    new GetBranchDashboardUseCase(new QueueDashboardUseCase(new QueueRepository()), assembler, branchAuthorizationService),
    new GetBranchComparisonReportUseCase(assembler, branchRepository, branchAuthorizationService),
    new GetBranchPerformanceReportUseCase(new QueueDashboardUseCase(new QueueRepository()), new PaymentRepository(), branchAuthorizationService),
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

  // docs/06-tasks/task-291.md (Epic RE2, Reservation Module Enhancement addendum).
  const newPatientReportController = new NewPatientReportController(new GetNewPatientReportUseCase(new ReservationRepository()));

  // docs/06-tasks/task-299.md (Reservation Module Addendum #2, R7).
  const completedReservationReportController = new CompletedReservationReportController(
    new GetCompletedReservationReportUseCase(new ReservationRepository()),
  );

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

  // docs/06-tasks/task-291.md: new permission (no existing report.*
  // permission covers a Reservation-scoped report), following the existing
  // `report.<dashboard>.read` namespace convention.
  router.get(
    '/reports/reservations/new-patients',
    requirePermission('report.reservation.new-patient.read'),
    validateQuery(NewPatientReportQueryDto),
    newPatientReportController.report,
  );

  // docs/06-tasks/task-299.md: same convention -- new permission, no
  // existing report.* code covers a Completed-Reservations-scoped report.
  router.get(
    '/reports/reservations/completed',
    requirePermission('report.reservation.completed.read'),
    validateQuery(CompletedReservationReportQueryDto),
    completedReservationReportController.report,
  );

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

  // docs/06-tasks/task-219.md/task-220.md: single-segment literal paths
  // under /reports/ -- must be registered before the generic
  // /reports/:reportCode catch-all or Express would treat
  // "branch-comparison"/"branch-performance" as a :reportCode value.
  router.get(
    '/reports/branch-comparison',
    requirePermission('report.branch-comparison.read'),
    validateQuery(BranchComparisonQueryDto),
    branchReportsController.comparison,
  );
  router.get(
    '/reports/branch-performance',
    requirePermission('report.branch-performance.read'),
    validateQuery(BranchPerformanceQueryDto),
    branchReportsController.performance,
  );

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
  // docs/06-tasks/task-218.md (Phase 4 Epic BD).
  router.get(
    '/reports/dashboards/branch',
    requirePermission('report.dashboard.branch.read'),
    validateQuery(BranchDashboardQueryDto),
    branchReportsController.dashboard,
  );

  return router;
}
