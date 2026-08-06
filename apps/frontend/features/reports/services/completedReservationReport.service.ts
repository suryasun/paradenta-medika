import { apiClient } from "@/lib/api-client";
import { PaginationMeta } from "@/types/api";
import { Reservation } from "@/features/reservation/types/reservation.types";
import { CompletedReservationReportParams, CompletedReservationReportSummary } from "../types/reports.types";

// task-299 (Reservation Module Addendum #2, R7). Same shape as
// newPatientReport.service.ts -- a separate file (not reports.service.ts's
// generic ApiSuccessBody<T> helpers) because `meta` nests a `summary`
// object alongside the usual page/limit/total/totalPages numbers.
export const completedReservationReportService = {
  async get(
    params: CompletedReservationReportParams,
  ): Promise<{ items: Reservation[]; meta: PaginationMeta; summary: CompletedReservationReportSummary }> {
    const response = await apiClient.get<{
      success: true;
      message: string;
      data: Reservation[];
      meta: PaginationMeta & { summary: CompletedReservationReportSummary };
    }>("/reports/reservations/completed", { params });
    const { summary, ...meta } = response.data.meta;
    return { items: response.data.data, meta, summary };
  },
};
