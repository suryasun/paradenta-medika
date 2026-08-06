import { apiClient } from "@/lib/api-client";
import { PaginationMeta } from "@/types/api";
import { Reservation } from "@/features/reservation/types/reservation.types";
import { NewPatientReportParams, NewPatientReportSummary } from "../types/reports.types";

// task-291 (Epic RE2, Reservation Module Enhancement addendum). A separate
// file (rather than reports.service.ts's ApiSuccessBody<T>-typed helpers)
// because this endpoint's `meta` carries a nested `summary` object
// alongside the usual page/limit/total/totalPages numbers --
// `PaginationMeta`'s `[key: string]: number` index signature can't type
// that without weakening it for every other endpoint that reuses it.
export const newPatientReportService = {
  async get(params: NewPatientReportParams): Promise<{ items: Reservation[]; meta: PaginationMeta; summary: NewPatientReportSummary }> {
    const response = await apiClient.get<{
      success: true;
      message: string;
      data: Reservation[];
      meta: PaginationMeta & { summary: NewPatientReportSummary };
    }>("/reports/reservations/new-patients", { params });
    const { summary, ...meta } = response.data.meta;
    return { items: response.data.data, meta, summary };
  },
};
