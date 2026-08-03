import { DashboardMetricAssembler } from '../services/DashboardMetricAssembler';
import { DashboardResponseDto } from '../dtos/DashboardResponseDto';
import { WAREHOUSE_DASHBOARD_METRICS } from '../services/MetricDefinitions';

/** docs/06-tasks/task-183.md, SAD Section 4.5 Inventory Reports: low-stock alert gauge only -- richer stock-value/expiry KPIs are Epic AA's own dedicated report endpoints (task-137-142), not duplicated here. */
export class GetWarehouseDashboardUseCase {
  constructor(private readonly assembler: DashboardMetricAssembler) {}

  async execute(branchId?: string): Promise<DashboardResponseDto> {
    return this.assembler.assemble(WAREHOUSE_DASHBOARD_METRICS, [], branchId);
  }
}
