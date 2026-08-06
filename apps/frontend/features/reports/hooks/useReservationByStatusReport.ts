import { useQuery } from "@tanstack/react-query";
import { reservationByStatusReportService } from "../services/reservationByStatusReport.service";
import { ReservationByStatusReportParams } from "../types/reports.types";

// task-305 (Reservation Module Addendum #4), renamed from
// useCompletedReservationReport (task-299).
export function useReservationByStatusReport(params: ReservationByStatusReportParams, enabled: boolean) {
  return useQuery({
    queryKey: ["reports", "by-status", params],
    queryFn: () => reservationByStatusReportService.get(params),
    enabled,
  });
}
