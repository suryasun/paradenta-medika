export interface DashboardMetricDto {
  code: string;
  value: number;
  currency?: string;
}

// docs/03-sad/20-module-report.md Section 6.1 response envelope
// ({ scope, dataAsOf, freshness, definitionVersion, metrics }), populated
// with only the three Phase-1-derivable metrics task-059.md scopes this
// task to: today's reservation count, today's queue counts by status, and
// today's collected payment amount.
export interface OperationsDashboardResponseDto {
  scope: { branchIds: string[]; timezone: string };
  dataAsOf: string;
  freshness: 'fresh';
  definitionVersion: '1.0.0';
  metrics: DashboardMetricDto[];
}
