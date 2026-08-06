import { apiClient } from "@/lib/api-client";
import { PaginationMeta } from "@/types/api";
import { Reservation } from "@/features/reservation/types/reservation.types";
import { ReservationByDoctorReportParams, ReservationByDoctorReportSummary } from "../types/reports.types";

// task-301 (Reservation Module Addendum #3). Same shape as the other
// Reservation-module report services -- a separate file because `meta`
// nests a `summary` object.
export const reservationByDoctorReportService = {
  async get(
    params: ReservationByDoctorReportParams,
  ): Promise<{ items: Reservation[]; meta: PaginationMeta; summary: ReservationByDoctorReportSummary }> {
    const response = await apiClient.get<{
      success: true;
      message: string;
      data: Reservation[];
      meta: PaginationMeta & { summary: ReservationByDoctorReportSummary };
    }>("/reports/reservations/by-doctor", { params });
    const { summary, ...meta } = response.data.meta;
    return { items: response.data.data, meta, summary };
  },
};
