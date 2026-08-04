import { DashboardMetricAssembler } from '../services/DashboardMetricAssembler';
import { BranchAuthorizationService } from '../services/BranchAuthorizationService';
import { IBranchRepository } from '../../../master-data/domain/repositories/IBranchRepository';
import { DashboardResponseDto } from '../dtos/DashboardResponseDto';
import { BRANCH_COMPARISON_GLOBAL_METRICS, BRANCH_COMPARISON_METRICS } from '../services/MetricDefinitions';

export interface BranchComparisonEntry {
  branchId: string;
  branchName: string;
  dataAsOf: string;
  freshness: DashboardResponseDto['freshness'];
  metrics: DashboardResponseDto['metrics'];
}

/**
 * docs/06-tasks/task-219.md: point-in-time, side-by-side comparison across
 * multiple branches using the same metric set for each (BRANCH_COMPARISON_METRICS),
 * so the entries are directly comparable. TC-RPT-008: rejects the whole
 * request (RPT_SCOPE_FORBIDDEN) if any requested branch is outside the
 * requester's authorized scope, per BranchAuthorizationService.
 */
export class GetBranchComparisonReportUseCase {
  constructor(
    private readonly dashboardMetricAssembler: DashboardMetricAssembler,
    private readonly branchRepository: IBranchRepository,
    private readonly branchAuthorizationService: BranchAuthorizationService,
  ) {}

  async execute(branchIds: string[], requesterUserId: string): Promise<BranchComparisonEntry[]> {
    await this.branchAuthorizationService.assertBranchesInScope(requesterUserId, branchIds);

    return Promise.all(
      branchIds.map(async (branchId) => {
        const [branch, dashboard] = await Promise.all([
          this.branchRepository.findById(branchId),
          this.dashboardMetricAssembler.assemble(BRANCH_COMPARISON_METRICS, BRANCH_COMPARISON_GLOBAL_METRICS, branchId),
        ]);
        return {
          branchId,
          branchName: branch?.branchName ?? branchId,
          dataAsOf: dashboard.dataAsOf,
          freshness: dashboard.freshness,
          metrics: dashboard.metrics,
        };
      }),
    );
  }
}
