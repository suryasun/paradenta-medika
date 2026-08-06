import { apiClient } from "@/lib/api-client";
import { PaginationMeta } from "@/types/api";
import { Reservation } from "@/features/reservation/types/reservation.types";
import { ReservationByStatusReportParams, ReservationByStatusReportSummary } from "../types/reports.types";

// task-305 (Reservation Module Addendum #4), renamed from
// completedReservationReport.service.ts (task-299). Same shape as
// newPatientReport.service.ts -- a separate file (not reports.service.ts's
// generic ApiSuccessBody<T> helpers) because `meta` nests a `summary`
// object alongside the usual page/limit/total/totalPages numbers.
export const reservationByStatusReportService = {
  async get(
    params: ReservationByStatusReportParams,
  ): Promise<{ items: Reservation[]; meta: PaginationMeta; summary: ReservationByStatusReportSummary }> {
    const response = await apiClient.get<{
      success: true;
      message: string;
      data: Reservation[];
      meta: PaginationMeta & { summary: ReservationByStatusReportSummary };
    }>("/reports/reservations/by-status", { params });
    const { summary, ...meta } = response.data.meta;
    return { items: response.data.data, meta, summary };
  },
};
