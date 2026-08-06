import { useQuery } from "@tanstack/react-query";
import { reservationByDoctorReportService } from "../services/reservationByDoctorReport.service";
import { ReservationByDoctorReportParams } from "../types/reports.types";

// task-301 (Reservation Module Addendum #3)
export function useReservationByDoctorReport(params: ReservationByDoctorReportParams, enabled: boolean) {
  return useQuery({
    queryKey: ["reports", "by-doctor", params],
    queryFn: () => reservationByDoctorReportService.get(params),
    enabled,
  });
}
