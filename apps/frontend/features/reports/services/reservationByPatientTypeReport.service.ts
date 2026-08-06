import { apiClient } from "@/lib/api-client";
import { PaginationMeta } from "@/types/api";
import { Reservation } from "@/features/reservation/types/reservation.types";
import { ReservationByPatientTypeReportParams, ReservationByPatientTypeReportSummary } from "../types/reports.types";

// task-300 (Reservation Module Addendum #3). Same shape as
// newPatientReport.service.ts/completedReservationReport.service.ts -- a
// separate file (not reports.service.ts's generic ApiSuccessBody<T>
// helpers) because `meta` nests a `summary` object.
export const reservationByPatientTypeReportService = {
  async get(
    params: ReservationByPatientTypeReportParams,
  ): Promise<{ items: Reservation[]; meta: PaginationMeta; summary: ReservationByPatientTypeReportSummary }> {
    const response = await apiClient.get<{
      success: true;
      message: string;
      data: Reservation[];
      meta: PaginationMeta & { summary: ReservationByPatientTypeReportSummary };
    }>("/reports/reservations/by-patient-type", { params });
    const { summary, ...meta } = response.data.meta;
    return { items: response.data.data, meta, summary };
  },
};
