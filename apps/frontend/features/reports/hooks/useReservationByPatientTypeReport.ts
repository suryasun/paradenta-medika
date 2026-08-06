import { useQuery } from "@tanstack/react-query";
import { reservationByPatientTypeReportService } from "../services/reservationByPatientTypeReport.service";
import { ReservationByPatientTypeReportParams } from "../types/reports.types";

// task-300 (Reservation Module Addendum #3)
export function useReservationByPatientTypeReport(params: ReservationByPatientTypeReportParams, enabled: boolean) {
  return useQuery({
    queryKey: ["reports", "by-patient-type", params],
    queryFn: () => reservationByPatientTypeReportService.get(params),
    enabled,
  });
}
