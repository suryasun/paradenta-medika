import { buildIdempotencyKey, CreateReportJobUseCase } from './CreateReportJobUseCase';
import { GetReportJobUseCase } from './GetReportJobUseCase';
import { CancelReportJobUseCase } from './CancelReportJobUseCase';
import { GetReportSnapshotUseCase } from './GetReportSnapshotUseCase';
import { DownloadReportExportUseCase } from './DownloadReportExportUseCase';
import { GetReportUseCase } from './GetReportUseCase';
import { GetBranchDashboardUseCase } from './GetBranchDashboardUseCase';
import { GetBranchComparisonReportUseCase } from './GetBranchComparisonReportUseCase';
import { GetBranchPerformanceReportUseCase } from './GetBranchPerformanceReportUseCase';
import { DashboardMetricAssembler } from '../services/DashboardMetricAssembler';
import { BranchAuthorizationService } from '../services/BranchAuthorizationService';
import { QueueDashboardUseCase } from '../../../queue/application/use-cases/QueueDashboardUseCase';
import { GetTrialBalanceReportUseCase } from '../../../finance/application/use-cases/GetTrialBalanceReportUseCase';
import { GetIncomeStatementReportUseCase } from '../../../finance/application/use-cases/GetIncomeStatementReportUseCase';
import { GetStockCardReportUseCase } from '../../../warehouse/application/use-cases/GetStockCardReportUseCase';
import { GetExpiryReportUseCase } from '../../../warehouse/application/use-cases/GetExpiryReportUseCase';
import { ReportDateRangeResolver } from '../../../finance/application/services/ReportDateRangeResolver';
import {
  ReportExportExpiredException,
  ReportFilterInvalidException,
  ReportJobDuplicateException,
  ReportJobNotFoundException,
  ReportSnapshotTamperedException,
} from '../../domain/exceptions/ReportExceptions';
import {
  FakeDashboardSummaryRepository,
  FakeExportArtifactRepository,
  FakeReportJobRepository,
  FakeReportSnapshotRepository,
} from '../../../../../tests/fakes/reportsFakes';
import { FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { FakePaymentRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeUserRoleRepository, FakeUserBranchRepository, FakeRoleRepository, buildRole } from '../../../../../tests/fakes/systemFakes';
import {
  FakeAccountRepository,
  FakeCashAccountRepository,
  FakeFinanceReportRepository,
  FakeFinancialPeriodRepository,
  FakeJournalRepository,
} from '../../../../../tests/fakes/financeFakes';
import { FakeBatchRepository, FakePurchaseOrderRepository, FakeStockRepository, FakeWarehouseReportRepository } from '../../../../../tests/fakes/warehouseFakes';
import { FakeAuditService } from '../../../../../tests/fakes/authFakes';

function buildSut() {
  const journalRepository = new FakeJournalRepository();
  const accountRepository = new FakeAccountRepository();
  const cashAccountRepository = new FakeCashAccountRepository();
  const financialPeriodRepository = new FakeFinancialPeriodRepository();
  const financeReportRepository = new FakeFinanceReportRepository(journalRepository, accountRepository, cashAccountRepository);
  const dateRangeResolver = new ReportDateRangeResolver(financialPeriodRepository);

  const stockRepository = new FakeStockRepository();
  const purchaseOrderRepository = new FakePurchaseOrderRepository();
  const warehouseReportRepository = new FakeWarehouseReportRepository(stockRepository, purchaseOrderRepository);
  const batchRepository = new FakeBatchRepository();

  const queueRepository = new FakeQueueRepository();
  const dashboardSummaryRepository = new FakeDashboardSummaryRepository();
  const branchRepository = new FakeBranchRepository();
  const assembler = new DashboardMetricAssembler(dashboardSummaryRepository, branchRepository);

  // Phase 4 hardening: branch.dashboard/comparison/performance are now
  // reachable through the job/export pipeline too.
  const roleRepository = new FakeRoleRepository();
  const userRoleRepository = new FakeUserRoleRepository(roleRepository);
  const branchAuthorizationService = new BranchAuthorizationService(userRoleRepository, new FakeUserBranchRepository());
  const getReportUseCase = new GetReportUseCase(
    new QueueDashboardUseCase(queueRepository),
    assembler,
    new GetTrialBalanceReportUseCase(financeReportRepository, dateRangeResolver),
    new GetIncomeStatementReportUseCase(financeReportRepository, dateRangeResolver),
    new GetStockCardReportUseCase(warehouseReportRepository),
    new GetExpiryReportUseCase(batchRepository),
    new GetBranchDashboardUseCase(new QueueDashboardUseCase(queueRepository), assembler, branchAuthorizationService),
    new GetBranchComparisonReportUseCase(assembler, branchRepository, branchAuthorizationService),
    new GetBranchPerformanceReportUseCase(new QueueDashboardUseCase(queueRepository), new FakePaymentRepository(), branchAuthorizationService),
  );

  const reportJobRepository = new FakeReportJobRepository();
  const reportSnapshotRepository = new FakeReportSnapshotRepository();
  const exportArtifactRepository = new FakeExportArtifactRepository();
  const auditService = new FakeAuditService();

  return {
    batchRepository,
    reportJobRepository,
    reportSnapshotRepository,
    exportArtifactRepository,
    auditService,
    roleRepository,
    userRoleRepository,
    createReportJobUseCase: new CreateReportJobUseCase(reportJobRepository, reportSnapshotRepository, exportArtifactRepository, getReportUseCase),
    getReportJobUseCase: new GetReportJobUseCase(reportJobRepository),
    cancelReportJobUseCase: new CancelReportJobUseCase(reportJobRepository),
    getReportSnapshotUseCase: new GetReportSnapshotUseCase(reportSnapshotRepository),
    downloadReportExportUseCase: new DownloadReportExportUseCase(exportArtifactRepository, auditService),
  };
}

describe('Report Job/Snapshot/Export Lifecycle (task-187-191)', () => {
  it('creates a job, executes it synchronously, and produces a snapshot + CSV artifact', async () => {
    const { createReportJobUseCase, batchRepository } = buildSut();
    await batchRepository.upsertReceipt({
      warehouseId: 'wh-1',
      itemId: 'item-1',
      batchNumber: 'LOT-A',
      receivedDate: new Date('2026-07-01'),
      expiryDate: new Date('2026-08-05'),
      quantity: 5,
      createdBy: 'staff-1',
    });

    const result = await createReportJobUseCase.execute({
      reportCode: 'inventory.expiry',
      format: 'csv',
      actorUserId: 'u1',
      requesterPermissions: ['report.warehouse.read', 'report.job.create'],
    });

    expect(result.job.status).toBe('COMPLETED');
    expect(result.snapshotId).toBeDefined();
    expect(result.artifactId).toBeDefined();
  });

  it('a retried identical request returns the existing COMPLETED job instead of re-executing (TC-RPT-012)', async () => {
    const { createReportJobUseCase, reportJobRepository } = buildSut();
    const first = await createReportJobUseCase.execute({
      reportCode: 'inventory.expiry',
      actorUserId: 'u1',
      requesterPermissions: ['report.warehouse.read'],
    });
    const second = await createReportJobUseCase.execute({
      reportCode: 'inventory.expiry',
      actorUserId: 'u1',
      requesterPermissions: ['report.warehouse.read'],
    });

    expect(second.job.id).toBe(first.job.id);
    expect(reportJobRepository.jobs.size).toBe(1);
  });

  it('two requests differing only by a non-date filter field (e.g. status) do NOT collide into the same idempotency key', async () => {
    const { createReportJobUseCase, reportJobRepository } = buildSut();
    const active = await createReportJobUseCase.execute({
      reportCode: 'inventory.expiry',
      filters: { status: 'ACTIVE' },
      actorUserId: 'u1',
      requesterPermissions: ['report.warehouse.read'],
    });
    const expired = await createReportJobUseCase.execute({
      reportCode: 'inventory.expiry',
      filters: { status: 'EXPIRED' },
      actorUserId: 'u1',
      requesterPermissions: ['report.warehouse.read'],
    });

    expect(expired.job.id).not.toBe(active.job.id);
    expect(reportJobRepository.jobs.size).toBe(2);
  });

  it('Phase 4 hardening: branch.comparison accepts multiple branchIds (its supportsMultiBranch flag lifts the single-branch cap)', async () => {
    const { createReportJobUseCase, roleRepository, userRoleRepository } = buildSut();
    const ownerRole = buildRole({ roleCode: 'OWNER', isCrossBranch: true });
    roleRepository.seed(ownerRole);
    await userRoleRepository.assignRoles('owner-1', [ownerRole.id]);

    const result = await createReportJobUseCase.execute({
      reportCode: 'branch.comparison',
      filters: { branchIds: ['branch-a', 'branch-b'] },
      actorUserId: 'owner-1',
      requesterPermissions: ['report.branch-comparison.read'],
    });

    expect(result.job.status).toBe('COMPLETED');
  });

  it('a report code without supportsMultiBranch still rejects more than one branchId with RPT_FILTER_INVALID', async () => {
    const { createReportJobUseCase } = buildSut();
    await expect(
      createReportJobUseCase.execute({
        reportCode: 'inventory.expiry',
        filters: { branchIds: ['branch-a', 'branch-b'] },
        actorUserId: 'u1',
        requesterPermissions: ['report.warehouse.read'],
      }),
    ).rejects.toBeInstanceOf(ReportFilterInvalidException);
  });

  it('rejects a duplicate request while the original job is still active with RPT_JOB_DUPLICATE', async () => {
    const { createReportJobUseCase, reportJobRepository } = buildSut();
    // Simulate an in-flight job by inserting one directly as RUNNING under the same key.
    await reportJobRepository.create({
      reportName: 'inventory.expiry',
      requestedBy: 'u1',
      branchScope: [],
      parameters: {},
      idempotencyKey: buildIdempotencyKey({ reportCode: 'inventory.expiry', actorUserId: 'u1', requesterPermissions: [] }),
    });

    await expect(
      createReportJobUseCase.execute({ reportCode: 'inventory.expiry', actorUserId: 'u1', requesterPermissions: ['report.warehouse.read'] }),
    ).rejects.toBeInstanceOf(ReportJobDuplicateException);
  });

  it('records a job execution failure as FAILED status rather than rejecting the create request', async () => {
    const { createReportJobUseCase } = buildSut();
    const result = await createReportJobUseCase.execute({
      reportCode: 'hr.attendance',
      actorUserId: 'u1',
      requesterPermissions: ['report.hr.read'],
    });
    expect(result.job.status).toBe('FAILED');
    expect(result.job.errorCode).toBe('RPT_DATASET_UNAVAILABLE');
    expect(result.snapshotId).toBeUndefined();
  });

  it('GetReportJobUseCase throws for an unknown job id', async () => {
    const { getReportJobUseCase } = buildSut();
    await expect(getReportJobUseCase.execute('does-not-exist')).rejects.toBeInstanceOf(ReportJobNotFoundException);
  });

  it('cancelling an already-completed job is a no-op, not an error', async () => {
    const { createReportJobUseCase, cancelReportJobUseCase } = buildSut();
    const { job } = await createReportJobUseCase.execute({
      reportCode: 'inventory.expiry',
      actorUserId: 'u1',
      requesterPermissions: ['report.warehouse.read'],
    });
    const cancelled = await cancelReportJobUseCase.execute(job.id);
    expect(cancelled.status).toBe('COMPLETED');
  });

  it('GetReportSnapshotUseCase blocks a tampered snapshot with RPT_SNAPSHOT_TAMPERED', async () => {
    const { reportSnapshotRepository, getReportSnapshotUseCase } = buildSut();
    const snapshot = await reportSnapshotRepository.create({
      snapshotDate: new Date(),
      module: 'warehouse',
      definitionVersion: '1.0.0',
      sourceWatermark: new Date().toISOString(),
      scopeHash: 'hash',
      payload: { foo: 'bar' },
      payloadHash: 'not-the-real-hash',
      schemaVersion: '1.0.0',
    });
    await expect(getReportSnapshotUseCase.execute(snapshot.id)).rejects.toBeInstanceOf(ReportSnapshotTamperedException);
  });

  it('DownloadReportExportUseCase rejects an expired artifact with RPT_EXPORT_EXPIRED and audits it', async () => {
    const { exportArtifactRepository, downloadReportExportUseCase, auditService } = buildSut();
    const artifact = await exportArtifactRepository.create({
      reportSnapshotId: 'snap-1',
      format: 'csv',
      filename: 'report.csv',
      content: 'a,b\n1,2',
      contentHash: 'x',
      retentionUntil: new Date(Date.now() - 1000),
      createdBy: 'u1',
    });

    await expect(downloadReportExportUseCase.execute(artifact.id, { userId: 'u1' })).rejects.toBeInstanceOf(ReportExportExpiredException);
    expect(auditService.records.some((r) => r.entity === 'ExportArtifact')).toBe(true);
  });

  it('DownloadReportExportUseCase serves a live artifact, sanitised against formula injection, and marks it downloaded', async () => {
    const { createReportJobUseCase, exportArtifactRepository, downloadReportExportUseCase, batchRepository } = buildSut();
    await batchRepository.upsertReceipt({
      warehouseId: 'wh-1',
      itemId: 'item-1',
      batchNumber: '=SUM(A1:A9)', // adversarial batch number -- must not become an executable formula in the CSV export
      receivedDate: new Date('2026-07-01'),
      expiryDate: new Date('2026-08-05'),
      quantity: 5,
      createdBy: 'staff-1',
    });
    const { artifactId } = await createReportJobUseCase.execute({
      reportCode: 'inventory.expiry',
      format: 'csv',
      actorUserId: 'u1',
      requesterPermissions: ['report.warehouse.read'],
    });

    const artifact = await downloadReportExportUseCase.execute(artifactId!, { userId: 'u1' });
    expect(artifact.content).toContain("'=SUM(A1:A9)");
    expect(artifact.downloadCount).toBe(1);
    const stored = await exportArtifactRepository.findById(artifactId!);
    expect(stored?.downloadedAt).not.toBeNull();
  });
});
