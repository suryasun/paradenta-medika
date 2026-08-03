import { DashboardMetricAssembler } from '../services/DashboardMetricAssembler';
import { GetExecutiveDashboardUseCase } from './GetExecutiveDashboardUseCase';
import { GetOperationsDashboardUseCase } from './GetOperationsDashboardUseCase';
import { GetWarehouseDashboardUseCase } from './GetWarehouseDashboardUseCase';
import { DEFINITION_VERSION } from '../services/MetricDefinitions';
import { FakeDashboardSummaryRepository } from '../../../../../tests/fakes/reportsFakes';
import { FakeBranchRepository } from '../../../../../tests/fakes/masterDataFakes';

function buildSut() {
  const dashboardSummaryRepository = new FakeDashboardSummaryRepository();
  const branchRepository = new FakeBranchRepository();
  const assembler = new DashboardMetricAssembler(dashboardSummaryRepository, branchRepository);
  return {
    dashboardSummaryRepository,
    branchRepository,
    executiveUseCase: new GetExecutiveDashboardUseCase(assembler),
    operationsUseCase: new GetOperationsDashboardUseCase(assembler),
    warehouseUseCase: new GetWarehouseDashboardUseCase(assembler),
  };
}

describe('Dashboards (task-179-183, SAD Section 6.1 response envelope)', () => {
  it('reports freshness=partial and zero values when no projection data exists yet', async () => {
    const { warehouseUseCase } = buildSut();
    const result = await warehouseUseCase.execute('branch-1');
    expect(result.freshness).toBe('partial');
    expect(result.metrics).toEqual([{ code: 'warehouse.low-stock.count', value: 0, currency: undefined }]);
    expect(result.definitionVersion).toBe(DEFINITION_VERSION);
  });

  it('reports freshness=fresh once every metric for the dashboard has a projected row', async () => {
    const { dashboardSummaryRepository, warehouseUseCase } = buildSut();
    await dashboardSummaryRepository.upsertSet({
      metricCode: 'warehouse.low-stock.count',
      branchId: 'branch-1',
      value: 3,
      dataAsOf: new Date('2026-08-01T00:00:00Z'),
      definitionVersion: DEFINITION_VERSION,
    });

    const result = await warehouseUseCase.execute('branch-1');
    expect(result.freshness).toBe('fresh');
    expect(result.metrics).toEqual([{ code: 'warehouse.low-stock.count', value: 3, currency: undefined }]);
    expect(result.dataAsOf).toBe('2026-08-01T00:00:00.000Z');
  });

  it('scope.branchIds is empty when no branchId filter is requested (documented Phase-4 gap: no per-user branch-assignment intersection yet)', async () => {
    const { warehouseUseCase } = buildSut();
    const result = await warehouseUseCase.execute(undefined);
    expect(result.scope.branchIds).toEqual([]);
  });

  it('executive dashboard merges global-scope metrics (branchId=null) with branch-scoped metrics for the same response', async () => {
    const { dashboardSummaryRepository, executiveUseCase } = buildSut();
    await dashboardSummaryRepository.upsertIncrement({
      metricCode: 'patient.new.count',
      branchId: null,
      value: 5,
      dataAsOf: new Date(),
      definitionVersion: DEFINITION_VERSION,
    });
    await dashboardSummaryRepository.upsertIncrement({
      metricCode: 'emr.visit.completed.count',
      branchId: 'branch-1',
      value: 2,
      dataAsOf: new Date(),
      definitionVersion: DEFINITION_VERSION,
    });
    // Different branch's visit count must not leak into branch-1's response.
    await dashboardSummaryRepository.upsertIncrement({
      metricCode: 'emr.visit.completed.count',
      branchId: 'branch-2',
      value: 99,
      dataAsOf: new Date(),
      definitionVersion: DEFINITION_VERSION,
    });

    const result = await executiveUseCase.execute('branch-1');
    const patientMetric = result.metrics.find((m) => m.code === 'patient.new.count');
    const visitMetric = result.metrics.find((m) => m.code === 'emr.visit.completed.count');
    expect(patientMetric?.value).toBe(5);
    expect(visitMetric?.value).toBe(2);
  });

  it('operations dashboard exposes reservation and per-status queue counters', async () => {
    const { operationsUseCase } = buildSut();
    const result = await operationsUseCase.execute('branch-1');
    const codes = result.metrics.map((m) => m.code);
    expect(codes).toEqual(
      expect.arrayContaining([
        'reservation.created.count',
        'reservation.cancelled.count',
        'queue.count.WAITING',
        'queue.count.CALLED',
        'emr.visit.completed.count',
      ]),
    );
  });
});
