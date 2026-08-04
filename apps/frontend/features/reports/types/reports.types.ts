// Mirrors apps/backend/src/modules/reports's actual DTOs (verified against
// the real controller/use-case/DTO files, not docs/02-design prose — see
// the Explore agent's report cited in the approved plan for this pass).

export interface MetricRow {
  code: string;
  value: number;
  currency?: string;
}

export type DashboardFreshness = "fresh" | "partial";

export interface DashboardResponse {
  scope: { branchIds: string[]; timezone: string };
  dataAsOf: string;
  freshness: DashboardFreshness;
  definitionVersion: string;
  metrics: MetricRow[];
}

export type DashboardKey = "executive" | "operations" | "clinical" | "finance" | "warehouse";

export interface QueuePerformanceReport extends DashboardResponse {
  queue: {
    queueSummary: { waiting: number; called: number; inService: number; completed: number; cancelled: number; noShow: number };
    doctorSummary: Array<{ doctorId: string; queueCount: number }>;
    branchSummary: { totalPatientToday: number; averageWaitingTimeMinutes: number; averageServiceTimeMinutes: number; completionRate: number };
  };
}

export interface ReportCatalogEntry {
  code: string;
  name: string;
  permission: string;
  ownerModule: string;
  implemented: boolean;
}

export type ReportJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "EXPIRED";

export interface ReportJob {
  id: string;
  reportName: string;
  requestedBy: string;
  generatedBy: string | null;
  branchScope: string[];
  parameters: { filters?: Record<string, unknown>; format?: "csv" | "json" };
  status: ReportJobStatus;
  startedAt: string | null;
  finishedAt: string | null;
  idempotencyKey: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportJobResult {
  job: ReportJob;
  snapshotId?: string;
  artifactId?: string;
}

export interface ReportSnapshot {
  id: string;
  reportJobId: string | null;
  snapshotDate: string;
  module: string;
  definitionVersion: string;
  sourceWatermark: string;
  scopeHash: string;
  payload: unknown;
  payloadUri: string | null;
  payloadHash: string;
  rowCount: number | null;
  schemaVersion: string;
  retentionUntil: string | null;
  createdAt: string;
}

export interface ReportJobFilters {
  branchIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  periodId?: string;
  warehouseId?: string;
  itemId?: string;
  status?: string;
}
