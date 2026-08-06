import { useQuery } from "@tanstack/react-query";
import { newPatientReportService } from "../services/newPatientReport.service";
import { NewPatientReportParams } from "../types/reports.types";

// task-291 (Epic RE2, Reservation Module Enhancement addendum)
export function useNewPatientReport(params: NewPatientReportParams, enabled: boolean) {
  return useQuery({
    queryKey: ["reports", "new-patients", params],
    queryFn: () => newPatientReportService.get(params),
    enabled,
  });
}
