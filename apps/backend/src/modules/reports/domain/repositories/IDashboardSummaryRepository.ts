export interface UpsertMetricInput {
  metricCode: string;
  branchId: string | null;
  dimensionKey?: string;
  value: number;
  currency?: string;
  dataAsOf: Date;
  definitionVersion: string;
}

export interface DashboardMetricRow {
  metricCode: string;
  branchId: string | null;
  dimensionKey: string;
  value: number;
  currency: string | null;
  dataAsOf: Date;
  definitionVersion: string;
}

/**
 * docs/03-sad/20-module-report.md Section 5.4 dashboard_summaries.
 * `upsertIncrement` accumulates a delta (counters); `upsertSet` overwrites
 * with an absolute value (gauges recomputed from a source-of-truth query,
 * e.g. current outstanding balance or low-stock count).
 */
export interface IDashboardSummaryRepository {
  upsertIncrement(input: UpsertMetricInput): Promise<void>;
  upsertSet(input: UpsertMetricInput): Promise<void>;
  listByCodes(metricCodes: string[], branchId?: string | null): Promise<DashboardMetricRow[]>;
}
