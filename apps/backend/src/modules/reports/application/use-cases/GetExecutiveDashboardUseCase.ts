import { DashboardMetricAssembler } from '../services/DashboardMetricAssembler';
import { DashboardResponseDto } from '../dtos/DashboardResponseDto';
import { EXECUTIVE_DASHBOARD_METRICS } from '../services/MetricDefinitions';

const GLOBAL_METRICS = ['patient.new.count', 'reservation.created.count', 'billing.collection'];

/** docs/06-tasks/task-179.md, SAD Section 4.2 Executive Dashboard KPI table. Payroll cost is omitted: no HR module/events exist in this codebase (same documented-gap precedent as Epic Z/task-136). */
export class GetExecutiveDashboardUseCase {
  constructor(private readonly assembler: DashboardMetricAssembler) {}

  async execute(branchId?: string): Promise<DashboardResponseDto> {
    return this.assembler.assemble(EXECUTIVE_DASHBOARD_METRICS, GLOBAL_METRICS, branchId);
  }
}
