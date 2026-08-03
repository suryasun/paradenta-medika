import { DashboardMetricAssembler } from '../services/DashboardMetricAssembler';
import { DashboardResponseDto } from '../dtos/DashboardResponseDto';
import { CLINICAL_DASHBOARD_METRICS } from '../services/MetricDefinitions';

/**
 * docs/06-tasks/task-181.md, SAD Section 4.7 Clinical and Quality Reports:
 * "aggregate and purpose-bound... identifiers and free-text EMR content are
 * excluded by default." Only visit-completed count is available: EMR's
 * event catalog in this codebase publishes EMRFinished only (no separate
 * "treatment finalised" event exists yet, despite Section 7.2 listing one),
 * so richer treatment/diagnosis-category breakdowns are a documented gap,
 * not an omission.
 */
export class GetClinicalDashboardUseCase {
  constructor(private readonly assembler: DashboardMetricAssembler) {}

  async execute(branchId?: string): Promise<DashboardResponseDto> {
    return this.assembler.assemble(CLINICAL_DASHBOARD_METRICS, [], branchId);
  }
}
