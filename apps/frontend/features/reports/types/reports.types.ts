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

// Phase 4, task-218/219/220 (apps/backend's BranchDashboardResponseDto /
// BranchComparisonEntry / BranchPerformancePeriodEntry -- verified against
// the actual use-case source, not docs prose).
export interface QueueSummary {
  waiting: number;
  called: number;
  inService: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface DoctorQueueCount {
  doctorId: string;
  queueCount: number;
}

export interface QueueBranchSummary {
  totalPatientToday: number;
  averageWaitingTimeMinutes: number | null;
  averageServiceTimeMinutes: number | null;
  completionRate: number;
}

export interface BranchDashboardResponse {
  scope: { branchIds: string[]; timezone: string };
  dataAsOf: string;
  freshness: DashboardFreshness;
  definitionVersion: string;
  queue: {
    queueSummary: QueueSummary;
    doctorSummary: DoctorQueueCount[];
    branchSummary: QueueBranchSummary;
  };
  billing: MetricRow[];
}

export interface BranchComparisonEntry {
  branchId: string;
  branchName: string;
  dataAsOf: string;
  freshness: DashboardFreshness;
  metrics: MetricRow[];
}

export interface BranchPerformancePeriodEntry {
  date: string;
  totalPatients: number;
  averageWaitingTimeMinutes: number | null;
  completionRate: number;
  doctorProductivity: DoctorQueueCount[];
  billingCollected: number;
}

// task-291 (Epic RE2, Reservation Module Enhancement addendum). Mirrors
// apps/backend's GetNewPatientReportUseCase's NewPatientReportSummary.
export interface NewPatientReportSummary {
  totalNewPatients: number;
  topProcedure: string | null;
  conversionRate: number;
}

export interface NewPatientReportParams {
  dateFrom: string;
  dateTo: string;
  page?: number;
  limit?: number;
}

// task-299 (Reservation Module Addendum #2, R7). Mirrors apps/backend's
// GetCompletedReservationReportUseCase's CompletedReservationReportSummary.
export interface CompletedReservationReportSummary {
  totalCompleted: number;
  trend: { date: string; count: number }[];
}

export interface CompletedReservationReportParams {
  dateFrom: string;
  dateTo: string;
  page?: number;
  limit?: number;
}

// task-300 (Reservation Module Addendum #3). Mirrors apps/backend's
// GetReservationByPatientTypeReportUseCase's ReservationByPatientTypeReportSummary.
export interface ReservationByPatientTypeReportSummary {
  newCount: number;
  oldCount: number;
  newPercentage: number;
  oldPercentage: number;
  breakdown: { type: "NEW" | "OLD"; count: number }[];
}

export interface ReservationByPatientTypeReportParams {
  dateFrom: string;
  dateTo: string;
  page?: number;
  limit?: number;
}

// task-301 (Reservation Module Addendum #3). Mirrors apps/backend's
// GetReservationByDoctorReportUseCase's ReservationByDoctorReportSummary.
export interface ReservationByDoctorReportSummary {
  totalDoctors: number;
  breakdown: { doctorId: string; count: number }[];
}

export interface ReservationByDoctorReportParams {
  dateFrom: string;
  dateTo: string;
  doctorId?: string;
  page?: number;
  limit?: number;
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
