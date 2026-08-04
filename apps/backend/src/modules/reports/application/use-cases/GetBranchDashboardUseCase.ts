import { QueueDashboardUseCase } from '../../../queue/application/use-cases/QueueDashboardUseCase';
import { QueueDashboardResponseDto } from '../../../queue/application/dtos/QueueDashboardResponseDto';
import { DashboardMetricAssembler } from '../services/DashboardMetricAssembler';
import { BranchAuthorizationService } from '../services/BranchAuthorizationService';
import { DashboardResponseDto } from '../dtos/DashboardResponseDto';
import { BILLING_GLOBAL_METRICS, BILLING_REPORT_METRICS } from '../services/MetricDefinitions';

export interface BranchDashboardResponseDto {
  scope: DashboardResponseDto['scope'];
  dataAsOf: string;
  freshness: DashboardResponseDto['freshness'];
  definitionVersion: string;
  queue: QueueDashboardResponseDto;
  billing: DashboardResponseDto['metrics'];
}

/**
 * docs/06-tasks/task-218.md: single-branch operational summary combining
 * Queue's Manager Dashboard (Total Queue, Average Waiting, Doctor
 * Performance -- QueueDashboardUseCase, task-047) and Billing's daily
 * summary (the same billing.daily-summary metric set GetReportUseCase
 * already assembles), scoped and authorized to one branch at a time.
 */
export class GetBranchDashboardUseCase {
  constructor(
    private readonly queueDashboardUseCase: QueueDashboardUseCase,
    private readonly dashboardMetricAssembler: DashboardMetricAssembler,
    private readonly branchAuthorizationService: BranchAuthorizationService,
  ) {}

  async execute(branchId: string, requesterUserId: string): Promise<BranchDashboardResponseDto> {
    await this.branchAuthorizationService.assertBranchInScope(requesterUserId, branchId);

    const [queue, billing] = await Promise.all([
      this.queueDashboardUseCase.execute(branchId),
      this.dashboardMetricAssembler.assemble(BILLING_REPORT_METRICS, BILLING_GLOBAL_METRICS, branchId),
    ]);

    return {
      scope: billing.scope,
      dataAsOf: billing.dataAsOf,
      freshness: billing.freshness,
      definitionVersion: billing.definitionVersion,
      queue,
      billing: billing.metrics,
    };
  }
}
