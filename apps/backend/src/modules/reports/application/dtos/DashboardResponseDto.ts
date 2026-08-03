export type DashboardFreshness = 'fresh' | 'partial';

export interface DashboardMetricDto {
  code: string;
  value: number;
  currency?: string;
}

/** docs/03-sad/20-module-report.md Section 6.1 response envelope, shared by all Epic AG dashboards. */
export interface DashboardResponseDto {
  scope: { branchIds: string[]; timezone: string };
  dataAsOf: string;
  freshness: DashboardFreshness;
  definitionVersion: string;
  metrics: DashboardMetricDto[];
}
