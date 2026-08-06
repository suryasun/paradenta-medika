import { useQuery } from "@tanstack/react-query";
import { completedReservationReportService } from "../services/completedReservationReport.service";
import { CompletedReservationReportParams } from "../types/reports.types";

// task-299 (Reservation Module Addendum #2, R7)
export function useCompletedReservationReport(params: CompletedReservationReportParams, enabled: boolean) {
  return useQuery({
    queryKey: ["reports", "completed-reservations", params],
    queryFn: () => completedReservationReportService.get(params),
    enabled,
  });
}
