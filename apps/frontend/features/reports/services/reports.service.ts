import { apiClient } from "@/lib/api-client";
import { ApiSuccessBody } from "@/types/api";
import {
  CreateReportJobResult,
  DashboardKey,
  DashboardResponse,
  ReportCatalogEntry,
  ReportJob,
  ReportJobFilters,
  ReportSnapshot,
} from "../types/reports.types";

export const dashboardService = {
  async get(key: DashboardKey, branchId?: string): Promise<DashboardResponse> {
    const response = await apiClient.get<ApiSuccessBody<DashboardResponse>>(`/reports/dashboards/${key}`, { params: { branchId } });
    return response.data.data;
  },
};

export const reportCatalogService = {
  async list(): Promise<ReportCatalogEntry[]> {
    const response = await apiClient.get<ApiSuccessBody<ReportCatalogEntry[]>>("/reports/definitions");
    return response.data.data;
  },
};

export const onDemandReportService = {
  async get<T>(reportCode: string, params: Record<string, unknown> = {}): Promise<T> {
    const response = await apiClient.get<ApiSuccessBody<T>>(`/reports/${reportCode}`, { params });
    return response.data.data;
  },
};

export const reportJobService = {
  async create(reportCode: string, payload: { filters?: ReportJobFilters; format?: "csv" | "json"; timezone?: string }): Promise<CreateReportJobResult> {
    const response = await apiClient.post<ApiSuccessBody<CreateReportJobResult>>(`/reports/${reportCode}/jobs`, payload);
    return response.data.data;
  },
  async detail(jobId: string): Promise<ReportJob> {
    const response = await apiClient.get<ApiSuccessBody<ReportJob>>(`/reports/jobs/${jobId}`);
    return response.data.data;
  },
  async cancel(jobId: string): Promise<ReportJob> {
    const response = await apiClient.post<ApiSuccessBody<ReportJob>>(`/reports/jobs/${jobId}/cancel`);
    return response.data.data;
  },
};

export const reportSnapshotService = {
  async get(snapshotId: string): Promise<ReportSnapshot> {
    const response = await apiClient.get<ApiSuccessBody<ReportSnapshot>>(`/reports/snapshots/${snapshotId}`);
    return response.data.data;
  },
};

export const reportExportService = {
  // Raw CSV body (Content-Disposition attachment), not the standard JSON
  // envelope -- needs the bearer token on the request itself, so this
  // fetches as a blob and triggers a client-side save rather than a plain
  // <a href> (which wouldn't carry the Authorization header).
  async download(artifactId: string): Promise<{ blob: Blob; filename: string }> {
    const response = await apiClient.get(`/reports/exports/${artifactId}/download`, { responseType: "blob" });
    const disposition: string | undefined = response.headers["content-disposition"];
    const match = disposition?.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] ?? `${artifactId}.csv`;
    return { blob: response.data as Blob, filename };
  },
};
