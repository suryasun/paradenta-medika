// Mirrors apps/backend/src/modules/reports/application/dtos/OperationsDashboardResponseDto.ts
export interface DashboardMetric {
  code: string;
  value: number;
  currency?: string;
}

export interface OperationsDashboard {
  scope: { branchIds: string[]; timezone: string };
  dataAsOf: string;
  freshness: "fresh";
  definitionVersion: string;
  metrics: DashboardMetric[];
}
