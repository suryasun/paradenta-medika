import { DashboardMetricAssembler } from '../services/DashboardMetricAssembler';
import { DashboardResponseDto } from '../dtos/DashboardResponseDto';
import { OPERATIONS_DASHBOARD_METRICS } from '../services/MetricDefinitions';

const GLOBAL_METRICS = ['reservation.created.count', 'reservation.cancelled.count'];

/**
 * docs/06-tasks/task-180.md, SAD Section 4.3 Operational Reports. Supersedes
 * task-059's Phase 1 simplified implementation at the same route -- that
 * version read `IReservationRepository`/`IQueueRepository`/`IPaymentRepository`
 * directly and scoped to "today"; this version reads the Epic AG projection
 * (dashboard_summaries) instead, with cumulative-since-activation grain (see
 * MetricDefinitions.ts), which is the intended architecture upgrade for this
 * phase, not a functional regression.
 */
export class GetOperationsDashboardUseCase {
  constructor(private readonly assembler: DashboardMetricAssembler) {}

  async execute(branchId?: string): Promise<DashboardResponseDto> {
    return this.assembler.assemble(OPERATIONS_DASHBOARD_METRICS, GLOBAL_METRICS, branchId);
  }
}
