import { ListReportDefinitionsUseCase } from './ListReportDefinitionsUseCase';
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
  ReportDatasetUnavailableException,
  ReportDefinitionNotFoundException,
  ReportFilterInvalidException,
  ReportRangeTooLargeException,
  ReportScopeForbiddenException,
} from '../../domain/exceptions/ReportExceptions';
import { FakeDashboardSummaryRepository } from '../../../../../tests/fakes/reportsFakes';
import { FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';
import { FakeQueueRepository } from '../../../../../tests/fakes/queueFakes';
import { FakePaymentRepository } from '../../../../../tests/fakes/billingFakes';
import { FakeUserRoleRepository, FakeUserBranchRepository, FakeRoleRepository } from '../../../../../tests/fakes/systemFakes';
import { FakeFinanceReportRepository, FakeAccountRepository, FakeJournalRepository, FakeCashAccountRepository, FakeFinancialPeriodRepository } from '../../../../../tests/fakes/financeFakes';
import { FakeBatchRepository, FakeWarehouseReportRepository, FakeStockRepository, FakePurchaseOrderRepository } from '../../../../../tests/fakes/warehouseFakes';

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
  // reachable through GetReportUseCase too, same fake-repository pattern
  // GetBranchDashboardUseCase.test.ts/etc. already use.
  const branchAuthorizationService = new BranchAuthorizationService(new FakeUserRoleRepository(new FakeRoleRepository()), new FakeUserBranchRepository());
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

  return {
    listReportDefinitionsUseCase: new ListReportDefinitionsUseCase(),
    getReportUseCase,
    batchRepository,
    dashboardSummaryRepository,
  };
}

describe('Report Catalog (task-185/186, SAD Section 6.3/6.4)', () => {
  it('lists only the report codes the requester has permission for', () => {
    const { listReportDefinitionsUseCase } = buildSut();
    const result = listReportDefinitionsUseCase.execute(['report.warehouse.read']);
    expect(result.map((r) => r.code)).toEqual(['inventory.stock-card', 'inventory.expiry']);
  });

  it('returns the full catalog for a requester with every permission (10 rows per Section 6.3)', () => {
    const { listReportDefinitionsUseCase } = buildSut();
    const allPermissions = [
      'report.operations.read',
      'report.clinical.read',
      'report.billing.read',
      'report.finance.read',
      'report.warehouse.read',
      'report.hr.read',
      'report.hr.payroll.read',
      'report.audit.read',
    ];
    const result = listReportDefinitionsUseCase.execute(allPermissions);
    expect(result).toHaveLength(10);
  });

  it('Phase 4 hardening: including the branch-report permissions surfaces all 13 catalog rows (10 literal + 3 Phase 4 extension)', () => {
    const { listReportDefinitionsUseCase } = buildSut();
    const allPermissions = [
      'report.operations.read',
      'report.clinical.read',
      'report.billing.read',
      'report.finance.read',
      'report.warehouse.read',
      'report.hr.read',
      'report.hr.payroll.read',
      'report.audit.read',
      'report.dashboard.branch.read',
      'report.branch-comparison.read',
      'report.branch-performance.read',
    ];
    const result = listReportDefinitionsUseCase.execute(allPermissions);
    expect(result).toHaveLength(13);
    expect(result.map((r) => r.code)).toEqual(expect.arrayContaining(['branch.dashboard', 'branch.comparison', 'branch.performance']));
  });

  it('rejects an unknown report code with RPT_DEFINITION_NOT_FOUND', async () => {
    const { getReportUseCase } = buildSut();
    await expect(getReportUseCase.execute('does.not.exist', {}, ['report.warehouse.read'], 'requester-1')).rejects.toBeInstanceOf(
      ReportDefinitionNotFoundException,
    );
  });

  it('rejects a known code the requester lacks permission for with RPT_SCOPE_FORBIDDEN', async () => {
    const { getReportUseCase } = buildSut();
    await expect(getReportUseCase.execute('finance.trial-balance', {}, ['report.warehouse.read'], 'requester-1')).rejects.toBeInstanceOf(
      ReportScopeForbiddenException,
    );
  });

  it('rejects a date range over the sync policy limit with RPT_RANGE_TOO_LARGE, forcing the async job path', async () => {
    const { getReportUseCase } = buildSut();
    await expect(
      getReportUseCase.execute(
        'inventory.expiry',
        { dateFrom: '2026-01-01', dateTo: '2026-12-31' },
        ['report.warehouse.read'],
        'requester-1',
      ),
    ).rejects.toBeInstanceOf(ReportRangeTooLargeException);
  });

  it('returns RPT_DATASET_UNAVAILABLE for hr.attendance -- no HR module/events exist in this codebase', async () => {
    const { getReportUseCase } = buildSut();
    await expect(getReportUseCase.execute('hr.attendance', {}, ['report.hr.read'], 'requester-1')).rejects.toBeInstanceOf(
      ReportDatasetUnavailableException,
    );
  });

  it('finance.trial-balance without branchId is rejected with RPT_FILTER_INVALID', async () => {
    const { getReportUseCase } = buildSut();
    await expect(getReportUseCase.execute('finance.trial-balance', {}, ['report.finance.read'], 'requester-1')).rejects.toBeInstanceOf(
      ReportFilterInvalidException,
    );
  });

  it('inventory.expiry dispatches to the existing GetExpiryReportUseCase/IBatchRepository', async () => {
    const { getReportUseCase, batchRepository } = buildSut();
    await batchRepository.upsertReceipt({
      warehouseId: 'wh-1',
      itemId: 'item-1',
      batchNumber: 'LOT-A',
      receivedDate: new Date('2026-07-01'),
      expiryDate: new Date('2026-08-05'),
      quantity: 5,
      createdBy: 'staff-1',
    });

    const result = (await getReportUseCase.execute('inventory.expiry', { status: 'ACTIVE' }, ['report.warehouse.read'], 'requester-1')) as {
      items: Array<{ batchNumber: string }>;
      total: number;
    };
    expect(result.total).toBe(1);
    expect(result.items[0].batchNumber).toBe('LOT-A');
  });

  it('operations.queue-performance merges QueueDashboardUseCase output with reservation projection metrics', async () => {
    const { getReportUseCase, dashboardSummaryRepository } = buildSut();
    await dashboardSummaryRepository.upsertIncrement({
      metricCode: 'reservation.created.count',
      branchId: null,
      value: 3,
      dataAsOf: new Date(),
      definitionVersion: '1.0.0',
    });

    const result = (await getReportUseCase.execute('operations.queue-performance', { branchId: 'branch-1' }, [
      'report.operations.read',
    ], 'requester-1')) as { queue: unknown; metrics: Array<{ code: string; value: number }> };
    expect(result.queue).toBeDefined();
    expect(result.metrics.find((m) => m.code === 'reservation.created.count')?.value).toBe(3);
  });

  it('Phase 4 hardening: branch.dashboard dispatches to GetBranchDashboardUseCase, enforcing branch scope for the requester', async () => {
    const { getReportUseCase } = buildSut();
    await expect(
      getReportUseCase.execute('branch.dashboard', { branchId: 'branch-a' }, ['report.dashboard.branch.read'], 'requester-1'),
    ).rejects.toBeInstanceOf(ReportScopeForbiddenException);
  });

  it('Phase 4 hardening: branch.comparison requires branchIds and dispatches to GetBranchComparisonReportUseCase', async () => {
    const { getReportUseCase } = buildSut();
    await expect(
      getReportUseCase.execute('branch.comparison', {}, ['report.branch-comparison.read'], 'requester-1'),
    ).rejects.toBeInstanceOf(ReportFilterInvalidException);
  });

  it('Phase 4 hardening: branch.performance requires branchId + dateFrom/dateTo and dispatches to GetBranchPerformanceReportUseCase', async () => {
    const { getReportUseCase } = buildSut();
    await expect(
      getReportUseCase.execute('branch.performance', { branchId: 'branch-a' }, ['report.branch-performance.read'], 'requester-1'),
    ).rejects.toBeInstanceOf(ReportFilterInvalidException);
  });
});
