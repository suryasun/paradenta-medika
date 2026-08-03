import { IBranchRepository } from '../../../master-data/domain/repositories/IBranchRepository';
import { IDashboardSummaryRepository } from '../../domain/repositories/IDashboardSummaryRepository';
import { DashboardResponseDto } from '../dtos/DashboardResponseDto';
import { DEFINITION_VERSION } from './MetricDefinitions';

const DEFAULT_TIMEZONE = 'Asia/Jakarta';

/**
 * Shared assembly logic for every Epic AG dashboard: reads the requested
 * metric codes from dashboard_summaries (global-scope metrics, stored
 * with branchId=null, are always included regardless of the requested
 * branch filter -- see MetricDefinitions.ts for which codes are global),
 * and builds the Section 6.1 response envelope.
 *
 * docs/06-tasks/task-179.md..task-183.md's Security Impact section
 * ("Cross-branch access intersected with the requester's assigned branch
 * scope") is not enforced here -- per-user branch assignment does not
 * exist until Phase 4 (task-210+), the exact same documented gap already
 * accepted for task-059's OperationsDashboardUseCase. `branchId` is
 * applied as a direct filter, not narrowed against an authorised scope.
 */
export class DashboardMetricAssembler {
  constructor(
    private readonly dashboardSummaryRepository: IDashboardSummaryRepository,
    private readonly branchRepository: IBranchRepository,
  ) {}

  async assemble(metricCodes: string[], globalMetricCodes: string[], branchId?: string): Promise<DashboardResponseDto> {
    const branchScopedCodes = metricCodes.filter((code) => !globalMetricCodes.includes(code));
    const globalCodes = metricCodes.filter((code) => globalMetricCodes.includes(code));

    const [branchRows, globalRows, branch] = await Promise.all([
      branchScopedCodes.length ? this.dashboardSummaryRepository.listByCodes(branchScopedCodes, branchId ?? undefined) : Promise.resolve([]),
      globalCodes.length ? this.dashboardSummaryRepository.listByCodes(globalCodes, null) : Promise.resolve([]),
      branchId ? this.branchRepository.findById(branchId) : Promise.resolve(null),
    ]);

    const rows = [...branchRows, ...globalRows];
    const byCode = new Map(rows.map((row) => [row.metricCode, row]));

    const metrics = metricCodes.map((code) => {
      const row = byCode.get(code);
      return { code, value: row?.value ?? 0, currency: row?.currency ?? undefined };
    });

    const presentCount = rows.length;
    const freshness = presentCount === metricCodes.length ? 'fresh' : ('partial' as const);
    const dataAsOf = rows.reduce<Date>((latest, row) => (row.dataAsOf > latest ? row.dataAsOf : latest), new Date(0));

    return {
      scope: { branchIds: branchId ? [branchId] : [], timezone: branch?.timezone ?? DEFAULT_TIMEZONE },
      dataAsOf: (presentCount > 0 ? dataAsOf : new Date()).toISOString(),
      freshness,
      definitionVersion: DEFINITION_VERSION,
      metrics,
    };
  }
}
