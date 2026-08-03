import { DashboardMetricAssembler } from '../services/DashboardMetricAssembler';
import { DashboardResponseDto } from '../dtos/DashboardResponseDto';
import { FINANCE_DASHBOARD_METRICS } from '../services/MetricDefinitions';

/** docs/06-tasks/task-182.md, SAD Section 4.2/4.4: posted-revenue/posted-expense (Finance-authoritative, never derived from raw Billing) plus outstanding balance. */
export class GetFinanceDashboardUseCase {
  constructor(private readonly assembler: DashboardMetricAssembler) {}

  async execute(branchId?: string): Promise<DashboardResponseDto> {
    return this.assembler.assemble(FINANCE_DASHBOARD_METRICS, [], branchId);
  }
}
